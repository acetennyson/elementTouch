<?php

$cookie = get_Cookie('settings');
if($cookie){
    $settings = $cookie["data"];
}else{
    $settings = getSettings();
    $settings = count($settings)?$settings[0]:[
        "id" => null,
        "bg_limit" => "08:00:00",
        "ed_limit" => "17:00:00",
        "dur_limit" => 2,
        "active" => 1,
        "created_at" => null,
    ];
    set_Cookie("settings", $settings, 300);
}

function getSettings() {
    [$err, $data] = advanceSelect('settings', '*', ['active'=> TRUE]);
    if($err){
        die(Error(2, "Unable to retrieve settings"));
    }
    return $data;
}

function isTimeWithinLimits($userDateTime, $userTimezone) {
    // Convert the user's local time to DEFAULT_TIMEZONE
    $userDateTimeInDefault = LocalToTime($userDateTime, $userTimezone);

    // Define the time limits in DEFAULT_TIMEZONE
    $startTime = new DateTime($userDateTimeInDefault->format('Y-m-d') . ' 08:00:00', new DateTimeZone(DEFAULT_TIMEZONE));
    $endTime = new DateTime($userDateTimeInDefault->format('Y-m-d') . ' 17:00:00', new DateTimeZone(DEFAULT_TIMEZONE));

    // Check if the user's time (in DEFAULT_TIMEZONE) falls within the allowed range
    return ($userDateTimeInDefault >= $startTime && $userDateTimeInDefault <= $endTime);
}

function canBookMeeting($startDateTime, string|null $timeZone = DEFAULT_TIMEZONE) {
    global $settings;
    $userId = infoCheck('id');
    $minBefore = 2 * 60;
    // do not allow booking of meeting for 40 minutes before and ealier date
    if (strtotime($startDateTime) <= time() ) {
        return ["code"=>0, "message"=>"Too late to book for that appointment"];
        // die( Error(3, "Too late to book for that appointment") );
    }
    if (strtotime($startDateTime) <= (time() + ($minBefore * 60)) ) {
        return ["code"=>0, "message"=>"Booking appointments less than $minBefore minutes before time is prohibited"];
        // die( Error(3, "can't book meeting for that date") );
    }

    if(!count($settings)) {
        return [$code=>1, "message"=>"No configuration for appointments"];
        // die( Error(3, "No configuration for appointments") );
        // $settings = advanceSelect('settings', 'bg_limit, ed_limit', ['active'=> TRUE]);
        // return canBookMeeting($startDateTime, $timeZone);
    }

    // Convert bg_limit and ed_limit into timestamps
    $userDateTimeLOCAL = LocalToTime($startDateTime, $timeZone);
    $userDateLOCALString = $userDateTimeLOCAL->format('Y-m-d');


    $bgLimit = $settings['bg_limit'];
    $edLimit = $settings['ed_limit'];
    $durLimit = $settings['dur_limit'];
    $meetingEnd = date("Y-m-d H:i:s", strtotime($userDateTimeLOCAL->format('Y-m-d H:i:s')) + ($durLimit * 60) );



    // Check if the requested time is within the limits
    /* if (strtotime($startDateTime) < $bgLimit || $meetingEnd > $edLimit) {
        return "Booking must be within the daily time limits.";
        // die( Error(3, "Booking must be within the daily time limits.") );
    } */
    if(!isTimeWithinLimits($startDateTime, $timeZone)){
        return ["code"=>2,"message"=>"Booking must be within the daily time limits. ($bgLimit AND $edLimit)"];
        // die( Error(3, "Booking must be within the daily time limits.") );
    }

    // Check if user already has a booking on the same day

    [$err, $booking] = advanceSelect(
        'meetings',
        "*",
        [
            "user"=>$userId,
            "start"=>"DATE($userDateLOCALString)"
        ]
    );
    if ( count($booking) ) {
        return ["code"=>3, "message"=>"You already have a booking on this day."];
        // die( Error(1, "You already have a booking on this day.") );
    }

    // Check for overlapping bookings
    [$err, $events] = advanceSelect(
        'events',
        "*",
        [
            /* "start"=>date('Y-m-d H:i:s', $meetingEnd),
            "end"=>$startDateTime, */
            "`restrict`"=>TRUE,
            "__SEARCH" => [
                "start LIKE" => " '%".$userDateTimeLOCAL->format("Y-m-d")."%' ",
            ]
        ]
    );
    if ( count($events) ) {
        // die (count($events));
        $evTitle = $events[0]['title'];
        return ["code"=>4, "events"=>$overlap, "message"=>"Appointment closed due to $evTitle."];
        // die( Error(2, "This time slot is already booked.") );
    }

    // Check for overlapping bookings
    [$err, $overlap] = advanceSelect(
        'meetings',
        "*",
        [
            /* "start"=>date('Y-m-d H:i:s', $meetingEnd),
            "end"=>$startDateTime, */
            "__BETWEEN" => [
                "__CONJUNCTOR" => "OR",
                "start"=> [
                    $userDateTimeLOCAL->format("Y-m-d H:i:s"),
                    $meetingEnd
                ],
                "end"=> [
                    $userDateTimeLOCAL->format("Y-m-d H:i:s"),
                    $meetingEnd
                ],
            ],
        ]
    );
    if ( count($overlap) ) {
        // die( print_r($overlap) );
        return ["code"=>4, "bookings"=>$overlap, "message"=>"Time overlaps with another meeting."];
        // die( Error(2, "This time slot is already booked.") );
    }

    return true;
}

/**
 * $title, $startTime, $endTime, $recurrenceType, $restrictBooking
 */
function createRecurringEvents(array $param = []) {

    $title = $param['title'];
    $startTime = $param['start'];
    $endTime = $param['end'];
    $recurrenceType = $param['type'];
    $restrictBooking = $param['restrict'];
    $currentStart = strtotime($startTime);
    $currentEnd = strtotime($endTime);

    while ($currentStart < strtotime('+1 year')) { // Generate events for up to 1 year
        $sql = advanceInsert('events', ["title"=>$title, "start"=>date('Y-m-d H:i:s', $currentStart), "end"=>date('Y-m-d H:i:s', $currentEnd), "type"=>$recurrenceType, "restrict"=>$restrictBooking, "created_at"=>date(), "creator"=>$userId]);

        if ($recurrenceType === 'weekly') {
            $currentStart = strtotime('+1 week', $currentStart);
            $currentEnd = strtotime('+1 week', $currentEnd);
        } elseif ($recurrenceType === 'monthly') {
            $currentStart = strtotime('+1 month', $currentStart);
            $currentEnd = strtotime('+1 month', $currentEnd);
        } elseif ($recurrenceType === 'yearly') {
            $currentStart = strtotime('+1 year', $currentStart);
            $currentEnd = strtotime('+1 year', $currentEnd);
        } else {
            break; // Non-recurring event
        }
    }
}

function editEvent($eventId, $param, $reOccur) {
    [$err, $event] = advanceSelect('events', ['id'=>$eventId]);
    if($reOccur){
        if(count($event)) {
            $name = $event[0]["title"];
            [$err, $affected] = advanceUpdate('events', $param, ["title"=>$name]);
        }
    }else{
        [$err, $affected] = advanceUpdate('events', $param, ["id"=>$name]);
    }
}

function deleteEvent($eventId, $reOccur) {
    [$err, $event] = advanceSelect('events', ['id'=>$eventId]);
    if($reOccur){
        if(count($event)) {
            $name = $event[0]["title"];
            [$err, $affected] = advanceDelete('events', ["title"=>$name]);
        }
    }else{
        [$err, $affected] = advanceDelete('events', ["id"=>$name]);
    }
}

function bookMeeting($param, $timeZone=DEFAULT_TIMEZONE) {
    $userId = infoCheck('id');
    $param = [
        ...$param,
        "user"=>$userId
    ];
    
    $dateTime = $param['start'];
    // $timeZone = $param['timeZone'];
    
    $auth1 = infoCheck('valid', "1");
    $auth2 = infoCheck('accType', "client");
    $auth3 = canBookMeeting($dateTime, $timeZone);

    if(!$auth1) {
        // not valid account
        die( Error(3, "Only Verified accounts can Book Events") );
        return ["Only Verified accounts can Book Events", null];
    }

    if(!$auth2) {
        // not a client
        die( Error(3, "Only Clients can Book Events") );
        return ["Only Clients can Book Events", null];
    }

    if( $auth3 && is_array($auth3) ){
        die( Error(3, $auth3['message']) );
        return $auth3['message'];
    }

    [$err, $data] = advanceInsert("meetings", $param);
    if($err){
        // 
        die( Error(2, $err) );
        return [$err, null];
    }
    return $data;
}

function suggestBookingTime($userDateTime, $timeZone = DEFAULT_TIMEZONE) {
    global $settings;
    $bgLimit = $settings['bg_limit'];
    $edLimit = $settings['ed_limit'];
    $durLimit = $settings['dur_limit'];
    
    $userDateTimeInDefault = LocalToTime($userDateTime, $userTimezone);
    // Define the time limits in DEFAULT_TIMEZONE
    $dayStart = new DateTime($userDateTimeInDefault->format('Y-m-d') . ' 08:00:00', new DateTimeZone(DEFAULT_TIMEZONE));
    $dayEnd = new DateTime($userDateTimeInDefault->format('Y-m-d') . ' 17:00:00', new DateTimeZone(DEFAULT_TIMEZONE));

    /* 
    [$err, $meetings] = advanceSelect(
        'meeting',
        '*',
        [
            "__BETWEEN" => [
                "start" => [
                    $dayStart,
                    $dayEnd
                ],
                "end" => [
                    $dayStart,
                    $dayEnd
                ]
            ],
            "__ORDERBY" => 'start',
        ]
    );

    if($err){
        die( Error(2, $err) );
    }
    */

    $recommendations = [];
    $runtime = ( $durLimit * 60 * 60 );
    $startt = strtotime($dayStart->format('Y-m-d H:i:s'));
    $endd = strtotime($dayEnd->format('Y-m-d H:i:s'));
    $lastt = strtotime($dayEnd->format('Y-m-d H:i:s'));
    $possibleNo = ( $startt - $endd ) / $runtime;
    $count = count($meetings);


    do {
        $starttime = $startt;
        $startt += $runtime;
        $endd += $runtime;
        $canBook = canBookMeeting($startt, $timeZone);
        if($canBook===true) {
            $recommendations[] = $starttime;
            continue;
        }

        $bookings = ($canBook['bookings']??$canBook['events'])??null;
        if(!empty($bookings)) {
            $startt = $booking[0]['start'];
        }

    } while ($endd <= $lastt);

    /* if($count){
        for ($i=0; $i < $count; $i++) { 
            $current = $meetings[$i];
            
        }
    }else{
        $difference = $endTime - $startTime;
        // ( strtotime($endTimeUTC->format('Y-m-d H:i:s')) - strtotime($startTimeUTC->format('Y-m-d H:i:s')) ) / (2*60*60) ;
    } */
    
    return $recommendations;
}

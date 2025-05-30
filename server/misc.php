<?php

if(!function_exists("set_Cookie")){
    function set_Cookie(string $name, $data, int $seconds, string $path="", string $domain = "", bool $httponly = true){
        $info = json_encode([
            "name"=>$name,
            "data"=>$data,
            "expires"=>$seconds?(time() + $seconds):0
        ]);
        return setcookie($name, $info, $seconds, $path, $domain, $httponly);
    }
}

function get_Cookie(string $name){
    if(!isset($_COOKIE[$name])) return false;
    return json_decode($_COOKIE[$name]);
}

function LocalToTime($localTime, $timeZone) {
    $date = new DateTime($localTime, new DateTimeZone($timeZone));
    $date->setTimezone(new DateTimeZone(DEFAULT_TIMEZONE));
    return $date;
}

function TimeToLocal($Time, $timeZone) {
    $date = new DateTime($Time, new DateTimeZone(DEFAULT_TIMEZONE));
    $date->setTimezone(new DateTimeZone($timeZone));
    return $date;
}

// $startTimeUTC = new DateTime('08:00', new DateTimeZone(DEFAULT_TIMEZONE));
// $endTimeUTC = new DateTime('17:00', new DateTimeZone(DEFAULT_TIMEZONE));

// print_r( ( strtotime($endTimeUTC->format('Y-m-d H:i:s')) - strtotime($startTimeUTC->format('Y-m-d H:i:s')) ) / (2*60*60)/* ->date */);
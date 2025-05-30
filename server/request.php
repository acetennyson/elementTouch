<?php
// header('Access-Control-Allow-Origin: *');
// header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');
include 'functions.php';
$allowedTypes = array('application/vnd.android.package.package-archive', 'application/zip');
$uploadType2 = array(
    "application/vnd.android.package.package-archive"=>'app',
    "application/vnd.android.package-archive"=>'app',
    "application/zip"=>'update',
    "application/x-zip-compressed"=>'update'
);

personalisedAccess();

// die(json_encode(array('yo'=>$_POST)));

if(isset($_POST) && count($_POST)){
    
    if(isset($_POST['authUser']) ){

        if(!isset($_POST['param'])){
            die(Error(1, 'Invalid Parameters'));
        }

        if(!isset($_POST['param']['email'])){
            die(Error(1, 'Email is required'));
        }
        if(!isset($_POST['param']['PasswordHash'])){
            die(Error(1, 'Please input Password'));
        }
        $user = signIn($_POST['param']);
        // die("OOO");
        if(!$user){
            die(Error(1, 'Incorrect Credentials'));
        }
        $_SESSION['user'] = $user;
        $permission = fetchPermission($user['id']);
        if($permission){
            $_SESSION['permission'] = $permission;
        }
        die( Result("Registration Successful", ['permission'=>$permission, 'user'=>&$user]) );
    }elseif (isset($_POST['regUser']) && isset($_POST['param'])) {
        # code...
        if(!isset($_POST['param']['name']) || !$_POST['param']['name']){
            die(Error(1, 'Name is required'));
        }
        if(!isset($_POST['param']['email'])  || !$_POST['param']['email']){
            die(Error(1, 'Email is required'));
        }
        if(!isset($_POST['param']['tel']) || !$_POST['param']['tel']){
            die(Error(1, 'Phone Number is required'));
        }
        if(!isset($_POST['param']['PasswordHash']) || !$_POST['param']['PasswordHash']){
            die(Error(1, 'Password is required'));
        }
        /* if(!isset($_POST['email'])){
            die(Error(1, 'Email is required'));
        }
        if(!isset($_POST['email'])){
            die(Error(1, 'Email is required'));
        }
        if(!isset($_POST['email'])){
            die(Error(1, 'Email is required'));
        }
        if(!isset($_POST['email'])){
            die(Error(1, 'Email is required'));
        } */
        $result = signUp($_POST['param']);
        echo Result("Registration Sucessful", $result);
        exit(0);

    }elseif ($_POST['logout']??false) {
        # code...
        $userdata = $_SESSION['user']??'';
        logout();
        die(Result('logged out',null));
    }else{

        if(!USER_INFO){
            die( Error(4, "Please Login First") );
        }

        if ($_POST['userdata']??false) {
            # code...
            echo Result('',["user"=>USER_INFO, 'permission'=>USER_AUTH]);
            exit(0);
        } elseif ($_POST['getUsers']??false) {
            if( !isset($_POST['param']) ) {
                die( Error(5, "Invalid Paramaters for fetching users") );
            }
            $conditions = $_POST['param']['conditions']??[];
            $filters = $_POST['param']['filters']??[];
            echo Result("", Users($conditions, $filters));
            exit(0);
        }


        elseif(isset($_POST['createBoard'])){
            if( !isset($_POST['param'], $_POST['param']['name'])) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for $boardName", $param) );
            }
            $data = createBoard($_POST['param']);
            echo $data?Result("$boardName Created Successfully", $data):Error(2, "Error Creating $boardName");
            exit(0);
        }elseif(isset($_POST['createProject'])){
            if( !isset($_POST['param'], $_POST['param']['name'])) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for $boardName", $param) );
            }
            $data = createProject($_POST['param']);
            echo $data?Result("$boardName Created Successfully", $data):Error(2, "Error Creating $boardName");
            exit(0);
        }elseif ($_POST['createTasklist']??false) {
            if( !isset($_POST['param'], $_POST['param']['name'], $_POST['param']['board'])) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for $tasklistName", $param) );
            }
            $data = createTasklist($_POST['param']);
            echo $data?Result("$tasklistName Created Successfully", $data):Error(2, "Error Creating $tasklistName");
            exit(0);
        }elseif ($_POST['createTask']??false) {
            # code...
            if( !isset($_POST['param'], $_POST['param']['name'], $_POST['param']['tasklist'], $_POST['param']['assignedTo'])) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for $taskName", $param) );
            }
            $data = createTask($_POST['param']);
            echo $data?Result("$taskName Created Successfully", $data):Error(2, "Error Creating $taskName");
            exit(0);
        }elseif ($_POST['addTaskmember']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['user'], $_POST['param']['tasklist'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for task member", $param) );
            }
            $data = addTaskmember($_POST['param']);
            echo $data?Result("Task member added", $data):Error(2, "Error adding task member");
            exit(0);
        }elseif ($_POST['addChecklist']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['task'], $_POST['param']['name'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for $checklistName", $param) );
            }
            $data = addChecklist($_POST['param']);
            echo $data?Result("$checklistName added", $data):Error(2, "Error adding $checklistName");
            exit(0);
        }elseif ($_POST['addChecklistitem']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['checklist'], $_POST['param']['name'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for $checklistitemName", $param) );
            }
            $data = addChecklistitem($_POST['param']);
            echo $data?Result("$checklistitemName added", $data):Error(2, "Error adding $checklistitemName");
            exit(0);
        }



        elseif ($_POST['getboards']??false) {
            $param = $_POST['param']??[];
            $result = getBoards($param);
            echo Result("No message", $result);
            exit(0);
        }elseif ($_POST['getProjects']??false) {
            $param = $_POST['param']??[];
            // die( Error(2, "getProjects is not implemented yet") );
            $result = getProject($param);
            echo Result("No message", $result);
            exit(0);
        }elseif (false) {
            # code...
        }elseif ($_POST['getTasks']??false) {
            $param = $_POST['param']??[];
            if(!is_array($param)) {
                $param = [];
            }
            $result = getTasks($param);
            echo Result("No message", $result);
            exit(0);
        }elseif ($_POST['getMembers']??false) {
            $param = $_POST['param']??[];
            $result = getMembersOf($param);
            echo Result("No message", $result);
            exit(0);
        }elseif ($_POST['getNonMembers']??false) {
            $param = $_POST['param']??[];
            $result = getNonMembersOf($param);
            echo Result("No message", $result);
            exit(0);
        }elseif ($_POST['getChecklists']??false) {
            $param = $_POST['param']??[];
            $result = getChecklists($param);
            echo Result("No message", $result);
            exit(0);
        }elseif ($_POST['getChecklistitems']??false) {
            $param = $_POST['param']??[];
            $result = getChecklistitems($param);
            echo Result("No message", $result);
            exit(0);
        }elseif($_POST['progressT']??false){
            echo Result("",calculateTaskProgress($_POST['progressT']));
            exit(0);
        }elseif ($_POST['progressTL']??false) {
            $tasklist = $_POST['progressTL'];
            echo Result('', calculateTasklistProgress($tasklist));
            exit(0);
        }elseif ($_POST['progressB']??false) {
            $board = $_POST['progressB'];
            echo Result('', calculateBoardProgress($board));
            exit(0);
        }
        


        elseif ($_POST['modify']??false) {
            if( !isset($_POST['param'], $_POST['param']['table'], $_POST['param']['condition'], $_POST['param']['param']) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters", $param) );
            }
            // die( print_r($_POST['param']) );
            $table = $_POST['param']['table'];
            $condition = $_POST['param']['condition'];
            $param = $_POST['param']['param'];
            $result = updateTable($table, $condition, $param);
            echo $result?Result("Data Updated", $result):Error(2, "Error Updating data", $_POST['param']);
            exit(0);
        }


        elseif ($_POST['delete']??false) {
            if( !isset($_POST['param'], $_POST['param']['table'], $_POST['param']['condition']) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters", $param) );
            }
            // die( print_r($_POST['param']) );
            $table = $_POST['param']['table'];
            $condition = $_POST['param']['condition'];
            // $param = $_POST['param']['param'];
            $result = deleteTable($table, $condition);
            echo $result?Result("Data deleted", $result):Error(2, "Error deleting data", $_POST['param']);
            exit(0);
        }



        elseif ($_POST['deleteProject']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['id'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for removing $boardName", $param) );
            }
            $data = deleteProject($_POST['param']);
            echo $data?Result("$tasklistName removed", $data):Error(2, "Error removing $tasklistName");
            exit(0);
        }elseif ($_POST['deleteTask']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['id'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for removing $taskName", $param) );
            }
            $data = deleteTask($_POST['param']);
            echo $data?Result("$taskName removed", $data):Error(2, "Error removing $taskName");
            exit(0);
        }elseif ($_POST['deleteTaskmember']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['user'], $_POST['param']['tasklist'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for removing member", $param) );
            }
            $data = deleteTaskmember($_POST['param']);
            echo $data?Result("Task member removed", $data):Error(2, "Error removing task member");
            exit(0);
        }elseif ($_POST['deleteChecklist']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['id'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for removing $checklistName", $param) );
            }
            $data = deleteChecklist($_POST['param']);
            echo $data?Result("$checklistName removed", $data):Error(2, "Error removing $checklistName");
            exit(0);
        }elseif ($_POST['deleteChecklistitem']??false) {
            # code...
            if( !isset( $_POST['param'], $_POST['param']['id'] ) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters for removing $checklistitemName", $param) );
            }
            $data = deleteChecklistitem($_POST['param']);
            echo $data?Result("$checklistitemName removed", $data):Error(2, "Error removing $checklistitemName");
            exit(0);
        }


        elseif($_POST['createDocument']??false) {

            if(!isset($_POST['param'], $_POST['param']['name'], $_POST['param']['type'])){
                die( Error(2, "invalid property for folder creation") );
            }

            $uploadPath = $_POST['currentPath']??null;
            $name = $_POST['param']['name'];
            $type = $_POST['param']['type'];
            $parent = $_POST['param']['parent']??null;
            // $name = $_POST['param']['name'];
            $param = [
                "name"=>$name,
                "type"=>$type,
                "parent"=>$parent,
                // "creator"=>infoCheck('id'),
                "size"=>null,
                "date"=>date('Y-m-d H:i:s'),
                // "download"=>'0',
                // "deleted"=>null,
                "link"=>uniqid(infoCheck('id')),
            ];

            [$error, $result] = createDocument($param);
            echo $error?Error(2, $error):Result('', $result);
            exit(0);

        }


        elseif ($_POST['uploadFile']??false) {
            if( !isset($_FILES['app']) || !isset($_POST['parent']) ) die(Error(1, "missing parameters during app upload"));
            $parent = $_POST['parent']?(int) $_POST['parent']:null;
            $files = $_FILES['app'];
            $denied = authCheck('manageDocument')?[]:['text/css','text/html','application/octet-stream', 'application/octet-stream', 'text/javascript'];
            $uploaded = [];
            // die(print_r($files));
            foreach ($files['name'] as $key => $value) {
                /* $tmp_name = $files['tmp_name'][$key];
                $error = $files['error'][$key];
                $size = $files['size'][$key];
                $type = $files['type'][$key]; */

                $f = array(
                    "name"=> $value,
                    "tmp_name" => $files['tmp_name'][$key],
                    "error" => $files['error'][$key],
                    "size" => $files['size'][$key],
                    "type" => $files['type'][$key]
                );
                $uploaded[] = uploadDocument($f, $parent, [], $denied);
            }

            echo Result('Upload Complete', $uploaded);
            exit(0);
        }
        elseif ($_POST['getDocument']??false) {
            if(!isset($_POST['param'])){
                die( Error(2, "Invalid param for fetching document") );
            }

            $param = $_POST['param'];
            echo Result('', getDocuments($param));
            exit(0);
        }
        elseif ($_POST['editDocument']??false) {
            // rename
            if( !isset($_POST['param'], $_POST['param']['id'], $_POST['param']['param']) ) {
                $param = $_POST['param']??null;
                die( Error(5, "Invalid Paramaters", $param) );
            }
            // die( print_r($_POST['param']) );
            $id = $_POST['param']['id'];
            $type = $_POST['param']['type']??'file';
            // $condition = $_POST['param']['condition'];
            $param = $_POST['param']['param'];
            $result = updateDoc($id, $param);
            echo $result?Result("Document Modified", $result):Error(2, "Error Updating data", $_POST['param']);
            exit(0);
        }

        elseif ($_POST['downloadDocument']??false) {
            # code...
        }

        elseif ($_POST['booking']??false) {
            $param = $_POST['param'];
            $timeZone = $param['timeZone']??null;
            unset($param['timeZone']);
            $time = $param['dateTime']??date("Y-m-d H:i:s");
            $localTime = LocaltoTime($time, $timeZone);
            $endTime = strtotime( $localTime->format('Y-m-d H:i:s') ) + ($settings['dur_limit'] * 60 * 60);
            // $result = canBookMeeting($localTime->format('Y-m-d H:i:s'), DEFAULT_TIMEZONE); 
            // if($result===true){
            $data = [
                "start"=> $localTime->format('Y-m-d H:i:s'),
                "end"=> date("Y-m-d H:i:s", $endTime),
                "created"=> date("Y-m-d H:i:s"),
            ];
            $id = bookMeeting($data, $timeZone);
            echo Result('', $id);
            exit(0);
            // }
            // $utc->format('Y-m-d H:i:s')
            // to 
        }

        else{
            echo Error(3, 'unable to process post request'.json_encode($_POST).'');
            exit(0);
        }

    }
}elseif(isset($_GET) && count($_GET)){
    if($_GET['test']??false){
        // echo Result("", Users(["valid"=>'1']));
        exit(0);
    }
    else {
        # code...
        if(!USER_INFO){
            die( Error(4, "Please Login First") );
        }

        if ($_GET['users']??false) {
            $conditions = $_GET['conditions']??[];
        }
        else{
            echo Error(3, 'unable to process get request');
        }
    }
    exit(0);
}elseif (isset($_FILES) && count($_FILES)) {
    echo Error(1, "File Found");
    exit(0);
} else{
    echo Error(3, 'unable to process request...', count($_FILES));
    exit(0);
}


// ALTER TABLE `taskmembers` DROP PRIMARY KEY, ADD PRIMARY KEY (`tasklist`, `user`) USING BTREE;
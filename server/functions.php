<?php
session_start();

// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

/**
 * -1: server paused
 * 0: Database server error
 * 1: unable to process, ur fault
 * 2: unable to process, server fault
 * 3: not allowed
 * 4: delete session
 * 5: unable to process, param error (check request from client Side)
 * 6: commit action
 */

include "config.php";
include "misc.php";
include "advanceSQL.php";
include "task.php";
include "document.php";
include "scheduler.php";
include "accounts.php";

function Error(int $code, string $msg, $detail = null) {
    $data = date('Y-m-d H:i:s') . " ---- " . ($detail ? json_encode($detail) : $msg) . " \n";
    file_put_contents('error_logs.txt', $data, FILE_APPEND);
    return json_encode(array('error' => array('code' => $code, 'message' => $msg)));
    // return $data;
}
function Result(string $msg = '', $data) {
    $dat = date('Y-m-d H:i:s') . "---" . "$msg" . " ---- " . json_encode($data) . " \n";
    file_put_contents('message_logs.txt', $dat, FILE_APPEND);
    return json_encode(array('data' => $data, 'message' => $msg));
}

function saveUpdate(string $index, $data){
    $file = UPLOAD_DIR."test.json";
    $textcontent = (file_exists($file)) ? file_get_contents($file) : '';
    // $objectcontent = 
    $objectcontent = !empty($textcontent) ? json_decode( $textcontent ) : new SaveData();
    if(!isset($objectcontent->$index) ) $objectcontent->$index = [];
    array_push($objectcontent->$index, $data);
    file_put_contents( $file, json_encode($objectcontent) );
    // die ($objectcontent);
}

function personalisedAccess() {
    if(isset($_SERVER['HTTP_REFERER'])){
        $refer = $_SERVER['HTTP_REFERER'];
        $allowed = false;
        
        foreach (ALLOWED_REF as $key => $value) {
            if(strpos($refer, $value)!==false){
                $allowed = true;
                break;
                // return;
            }
        }
    
        if(!$allowed) die( Error(3, "Unauthorised access detected") );
    
    }else Error(0, "referrer not set");
}

function connect()
{
    $con = mysqli_connect(DB_HOST, DB_USER, DB_PASS);
    // die("sas");
    if (!$con) {
        die(Error(-1, "Database Server Connection failed: " . mysqli_connect_error()));
    }
    return $con;
}

function connectS() {

    // mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $con = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    // die("sas");
    if (!$con) {
        die(Error(0, "Database Server Connection failed: " . mysqli_connect_error()));
    }
    return $con;
}

function connectDB() {
    $conn = connect();
    $query = "USE ".DB_NAME;
    $sql = mysqli_query($conn, $query);
    if (!$sql) {
        die (Error(0, "Database Connection Error: " . mysqli_error($conn)) );
    }
    return $conn;
}

function present($arg){
    return (isset($arg) && $arg && !empty($arg)) ? true : false;
}

function authenticationCheck(){
    if(!USER_INFO){
        logout();
        die( Error(4, "user authentication not found, please login") );
    }
    return USER_INFO;
}

function infoCheck(string $param, $value=false){
    $data = USER_INFO[$param]??false;
    return ($value!=false)?$data==$value:$data; 
}

function authCheck($name){
    return USER_AUTH[$name]??(USER_AUTH['master']??false);
}

function authorizationCheck($name){
    $user = authenticationCheck();
    if(!USER_AUTH){
        die( Error(3, "user permission data not found, contact administrator") );
    }

    if($user['id'] != USER_AUTH['id']){
        logout();
        die( Error(4, "corrupted data detected, logging again") );
    }
    return authCheck($name);
}


function signUp($param){
    if( !isset($param['email']) || !isset($param['PasswordHash'])){
        die( Error(2, "Invalid Paramaters for Authentication", $param) );
    }
    /* $username = $param['email'];
    $pass = $param['PasswordHash']; */

    $result = advanceInsert('users', $param);

    if( $result[0] ){
        die(Error(2, 'unable to perform authentication ' . $result[0]));
    }

    return $result[1]??null;
}

function signIn($param){
    if( !isset($param['email']) || !isset($param['PasswordHash'])){
        die( Error(2, "Invalid Paramaters for Authentication", $param) );
    }

    $username = $param['email'];
    $pass = $param['PasswordHash'];

    $result = advanceSelect('users', "*", ['email'=>$username, 'PasswordHash'=>$pass]);
    
    // die("YOYOOY");

    if( $result[0] ){
        die(Error(2, 'unable to perform authentication ' . $result[0]));
    }

    return $result[1][0]??null;
}

function fetchPermission($id){
    if(!present($id)){
        die( Error(2, "Invalid Paramaters for permission check ", $id) );
    }
    
    $result = advanceSelect('staffcontrol', '*', ['id'=>$id]);

    if( $result[0] ){
        die(Error(2, 'unable to perform authentication ' . $result[0]));
    }

    return $result[1][0]??null;
}

/* 

|    |  /~~~~\  |\   
|\  /| ( |__| ) | \  
| \/ |  \____/  |__\ 

*/



function updateTable(string $table, array $condition, array $param){
    # code...
    $userId = infoCheck('id');
    $isMaster = authCheck('master');
    $auth = false;
    if( !$isMaster ) {
        switch ($table) {
            case 'tasks':
                # code...
                $auth = (isTaskOf($userId, $condition['id'])==1 );
            break;

            case "checklists":
                $auth = isChecklistOf($userId, $condition['id']);
            break;

            case "checklistitems":
                $auth = isChecklistitemOf($userId, $condition['id']);
            break;
            
            case "users":
                $auth = authCheck('manageUser');
                $auth = $auth?$auth:($userId == $condition['id']);
            break;

            case "document":
                $auth = isDocumentOf($userId, $condition['id']);
            break;
            
            default:
                $auth = false;
            break;
        }
        if(!$auth){
            die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
        }   
    }

    if ( $table =="document" ) {
        $auth = isDocumentOf($userId, $condition['id'])==1;
        if(!$auth) die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
        $result = updateDoc($condition['id'], $param);

    } else {
        $r = advanceUpdate($table, $param, $condition);
        if( $r[0] ){
            die(Error(2, "Failed to edit $table | " . $r[0]));
        }
        // die( print_r([$r, $condition, $param]) );
        $result = $r[1]??true;
    }
    
    return $result;
}


function deleteTable(string $table, array $condition){
    # code...
    $userId = infoCheck('id');
    $isMaster = authCheck('master');
    $auth = false;
    if( !$isMaster ) {
        switch ($table) {
            case 'tasks':
                # code...
                $auth = (isTaskOf($userId, $condition['id'])==1 );
            break;

            case "checklists":
                $auth = isChecklistOf($userId, $condition['id']);
            break;

            case "checklistitems":
                $auth = isChecklistitemOf($userId, $condition['id']);
            break;
            
            case "users":
                $auth = $userId == $condition['id'];
            break;
            case "document":
                $auth = isDocumentOf($userId, $condition['id']);
            break;
            
            default:
                $auth = false;
            break;
        }
        if(!$auth){
            die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
        }   
    }

    if ($table=="document") {
        $id = $condition['id'];
        $conn = connectDB();
        $path = getFolderPath($id, $conn);
        $time = time();
        if( !rename($path, excludeString($path, DIRECTORY_SEPARATOR) . $time ) ) {
            die( Error(2, "Error deleting document") );
        };
        $result = updateDoc($id, [
            "deleted"=> (string) $time
        ], $conn);

        return $result;
    } else {
        $result = advanceDelete($table, $condition);
        if( $result[0] ){
            die(Error(2, "Error deleting: " . $result[0]));
        }
        
        return $result[1]??true;
    }
    
}



function logout(){
    unset($_SESSION['user']);
    unset($_SESSION['permission']);
    session_unset();
    session_destroy();
    return true;
}

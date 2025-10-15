<?php

const DB_HOST = 'localhost',
DB_USER = 'root',
DB_PASS = '',
DB_NAME = 'crm',

UPLOAD_DIR =  __DIR__ . DIRECTORY_SEPARATOR . 'uploads',
DEFAULT_TIMEZONE = "Africa/Douala";
// DEFAULT_TIMEZONE = "UTC";
// define('UPLOAD_DIR', 'uploads/');
define("ALLOWED_REF", ['localhost']);
define("BANNED_IP", []);

define("USER_INFO",  $_SESSION['user']??null);
define("USER_AUTH", $_SESSION['permission']??null);

date_default_timezone_set(DEFAULT_TIMEZONE);


/* const DB_HOST = 'srv1509.hstgr.io',


define("ALLOWED_REF", ['lavender-vulture-929230.hostingersite.com']);
define("BANNED_IP", []);

define("USER_INFO",  $_SESSION['user']??null);
define("USER_AUTH", $_SESSION['permission']??null);

$boardName = "WorkSpace";
$tasklistName = "Activity";
$taskName = "Task";
$checklistName = "Checklist";

$checklistitemName = "Checklist Item"; */

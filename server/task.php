<?php

/* 

|    | |~|  |  |~  === |~
|\  /| |~| |  |~   |  |~
| \/ | |_|  |_ |_   |  |_

*/

function isMemberOf (int $user, int $tasklist) {
    # code...
    $conn = connectDB();
    $query = " SELECT * FROM taskmembers WHERE tasklist = $tasklist AND user = $user ";
    $result = mysqli_query($conn, $query);
    if(!$result){
        return -1;
    }
    return mysqli_num_rows($result)?1:0;
}

function isTaskOf (int $user, int $task) {
    # code...
    $conn = connectDB();
    $query = " SELECT * FROM tasks WHERE task = $task AND assignedTo = $user ";
    $result = mysqli_query($conn, $query);
    if(!$result){
        return -1;
    }
    return mysqli_num_rows($result)?1:0;
}

function isChecklistOf (int $user, int $checklist) {
    # code...
    $conn = connectDB();
    $query = " SELECT * FROM checklists c
    JOIN tasks t ON c.task = t.id
    WHERE c.id = $checklist AND t.assignedTo = $user ";
    $result = mysqli_query($conn, $query);
    if(!$result){
        return -1;
    }
    return mysqli_num_rows($result)?1:0;
}

function isChecklistItemOf (int $user, int $checklistitem) {
    # code...
    $conn = connectDB();
    $query = " SELECT * FROM checklistitems ci
    JOIN checklists c ON ci.checklist = c.id
    JOIN tasks t ON c.task = t.id
    WHERE ci.id = $checklistitem AND t.assignedTo = $user ";
    $result = mysqli_query($conn, $query);
    if(!$result){
        return -1;
    }
    return mysqli_num_rows($result)?1:0;
}






/* 

|    |  /~~~~\  |\   
|\  /| ( |__| ) | \  
| \/ |  \____/  |__\ 

*/






function getProject(array $param){
    if(!infoCheck('accType', 'staff')){
        die( Error(1, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $user = infoCheck('id');
    $isMaster = authCheck('master');
    
    $id = (int) ( $param['id']??0 );
    $offset = (int) ( $param['step'] ?? 0) * (int) ( $param['size'] ?? 30);
    $search = $param['search']??null;
    $searchin = 'tl.name';
    $size = $param['size']??10;
    [$from, $to] = [$param['from']??null, $param['to']??null];
    $order = [$param['orderby']??null, $param['asc']??true];
    $query = "";
    $queryb = "";

    $where = false;

    if($id) {
        if($isMaster){
            return executeSQLQueries(" SELECT DISTINCT * FROM tasklists tl WHERE tl.id = $id ");
        }else{
            $query = " SELECT tl.* FROM tasklists tl
            taskmembers tm ON tl.id = tm.tasklist
            WHERE b.id = $id AND tm.user = $user";
            return executeSQLQueries($query);
        }
    }

    if(!$isMaster) {
        $query = " SELECT DISTINCT tl.* FROM tasklists tl
        JOIN taskmembers tm ON tl.id = tm.tasklist
        ";
        $query2 = " SELECT count(tl.id) FROM tasklists tl
        JOIN taskmembers tm ON tl.id = tm.tasklist
        ";
        $queryb = "WHERE tm.user = $user";
        $where = true;
    }else {
        $query = " SELECT DISTINCT * FROM tasklists tl";
        $query2 = " SELECT count(tl.id) FROM tasklists tl";
    }

    if (present($search)) {
        $queryb = ($where ? " AND" : " WHERE") . " ( $searchin LIKE '%$search%' ) ";
        $where = true;
    }

    if (present($from) && present($to)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (b.createdDate BETWEEN '$from' AND '$to')";
        $where = true;
    } elseif (present($from)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (b.createdDate >= '$from')";
        $where = true;
    } elseif (present($to)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (b.createdDate <= '$to')";
        $where = true;
    }

    if (present($order[0])) {
        $queryb .= " ORDER BY " . $order[0] . " " . ($order[1] ? "ASC" : "DESC");
    }
    $query2 .= $queryb;
    if (present($size))
        $query .= $queryb . " LIMIT $size " . (present($offset) ? "OFFSET $offset" : "");
    $query .= ";";

    return executeSQLQueries("$query $query2");

}

function getTasklists(array $param){
    if(!infoCheck('accType', 'staff')){
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $user = infoCheck('id');
    $isMaster = authCheck('master');
    
    $id = (int) ( $param['id']??0 );
    $board = (int) ( $param['board']??0 );
    $offset = (int) ( $param['step'] ?? 0) * (int) ( $param['size'] ?? 10);
    $search = $param['search']??null;
    $searchin = 'tl.name';
    $size = $param['size']??10;
    [$from, $to] = [$param['from']??null, $param['to']??null];
    $order = [$param['orderby']??null, $param['asc']??true];
    $query = "";
    $queryb = "";

    $where = false;

    if($id) {
        if($isMaster){
            return executeSQLQueries(" SELECT DISTINCT * FROM tasklists tl WHERE tl.id = $id AND tl.board = $board ");
        }else{
            $query = " SELECT tl.* 
            FROM tasklists tl
            JOIN taskmembers tm ON tl.id = tm.tasklist
            WHERE tl.id = $id AND tl.board = $board AND tm.user = $user";
            return executeSQLQueries($query);
        }
    }

    if(!$isMaster) {
        $query = " SELECT DISTINCT tl.* 
        FROM tasklists tl
        JOIN taskmembers tm ON tl.id = tm.tasklist
        ";
        $query2 = " SELECT count(tl.id) 
        FROM tasklists tl
        JOIN taskmembers tm ON tl.id = tm.tasklist
        ";
        $queryb = "WHERE tm.user = $user AND tl.board = $board";
        $where = true;
    }else {
        $query = " SELECT DISTINCT * FROM tasklists tl WHERE tl.board = $board";
        $query2 = " SELECT count(id) FROM tasklists tl WHERE tl.board = $board";
        $where = true;
    }

    if (present($search)) {
        $queryb = ($where ? " AND" : " WHERE") . " ( $searchin LIKE '%$search%' ) ";
        $where = true;
    }

    if (present($from) && present($to)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (tl.createdDate BETWEEN '$from' AND '$to')";
        $where = true;
    } elseif (present($from)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (tl.createdDate >= '$from')";
        $where = true;
    } elseif (present($to)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (tl.createdDate <= '$to')";
        $where = true;
    }

    if (present($order[0])) {
        $queryb .= " ORDER BY " . $order[0] . " " . ($order[1] ? "ASC" : "DESC");
    }
    $query2 .= $queryb;
    if (present($size))
        $query .= $queryb . " LIMIT $size " . (present($offset) ? "OFFSET $offset" : "");
    $query .= ";";

    return executeSQLQueries("$query $query2");

}

function getTasks(array $param){
    if(!infoCheck('accType', 'staff')){
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $user = infoCheck('id');
    $isMaster = authCheck('master');
    
    $id = (int) ( $param['id']??0 );
    $tasklist = (int) ( $param['tasklist']??0 );
    $offset = (int) ( $param['step'] ?? 0) * (int) ( $param['size'] ?? 30);
    $search = $param['search']??null;
    $searchin = 't.name';
    $size = $param['size']??10;
    [$from, $to] = [$param['from']??null, $param['to']??null];
    $order = [$param['orderby']??null, $param['asc']??true];
    $query = "";
    $queryb = "";

    $where = false;

    if($id) {
        if($isMaster){
            return executeSQLQueries(" SELECT DISTINCT t.*, u.name as taskuser, tl.name as project FROM tasks t JOIN users u ON t.assignedTo = u.id JOIN tasklists tl ON t.tasklist = tl.id WHERE t.id = $id AND t.tasklist = $tasklist ");
        }else{
            $query = " SELECT t.*, u.name as taskuser, tl.name as project 
            FROM tasks t
            JOIN taskmembers tm ON t.tasklist = tm.tasklist
            JOIN users u ON t.assignedTo = u.id
            JOIN tasklists tl ON t.tasklist = tl.id
            WHERE t.id = $id AND t.tasklist = $tasklist AND tm.user = $user";
            return executeSQLQueries($query);
        }
    }

    if(!$isMaster) {
        $query = " SELECT t.*, u.name as taskuser , tl.name as project
        FROM tasks t
        JOIN taskmembers tm ON t.tasklist = tm.tasklist
        JOIN users u ON t.assignedTo = u.id
        JOIN tasklists tl ON t.tasklist = tl.id
        ";
        $query2 = " SELECT count(t.id) as count
        FROM tasks t
        JOIN taskmembers tm ON t.tasklist = tm.tasklist
        JOIN users u ON t.assignedTo = u.id
        ";
        $queryb = "WHERE tm.user = $user AND t.tasklist = $tasklist";
        $where = true;
    }else {
        $query = " SELECT DISTINCT t.*, u.name as taskuser, tl.name as project FROM tasks t JOIN users u ON t.assignedTo = u.id JOIN tasklists tl ON t.tasklist = tl.id";
        $query2 = " SELECT count(*) as count FROM tasks t";
        
        if($tasklist){
            $query .= " WHERE t.tasklist = $tasklist";
            $query2 .= " WHERE t.tasklist = $tasklist";
            $where = true;
        }
    }

    if (present($search)) {
        $queryb = ($where ? " AND" : " WHERE") . " ( $searchin LIKE '%$search%' ) ";
        $where = true;
    }

    if (present($from) && present($to)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (t.dueDate BETWEEN '$from' AND '$to')";
        $where = true;
    } elseif (present($from)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (tl.createdDate >= '$from')";
        $where = true;
    } elseif (present($to)) {
        $queryb .= ($where ? " AND" : " WHERE") . " (tl.createdDate <= '$to')";
        $where = true;
    }

    if (present($order[0])) {
        $queryb .= " ORDER BY " . $order[0] . " " . ($order[1] ? "ASC" : "DESC");
    }
    $query2 .= $queryb;
    if (present($size))
        $query .= $queryb . " LIMIT $size " . (present($offset) ? "OFFSET $offset" : "");
    $query .= ";";

    return executeSQLQueries("$query $query2");

}

function getMembersOf(array $param){
    global $tasklistName;
    $tasklist = (int) ( $param['tasklist']??0 );
    
    if( !authorizationCheck('master') && isMemberOf(USER_INFO['id'], $tasklist)!=1 ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    
    $query = " SELECT tm.*, u.name as `name` 
    FROM taskmembers tm 
    JOIN users u ON tm.user = u.id 
    WHERE tm.tasklist = $tasklist ";
    
    return executeSQLQueries($query);
}

function getNonMembersOf(array $param){
    $isMaster = authCheck('master');
    $tasklist = (int) ( $param['tasklist']??0 );
    
    if( !$isMaster ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    
    $query = " SELECT u.id, u.name 
    FROM users u
    WHERE u.accType='staff' AND u.id NOT IN (
        SELECT tm.user
        FROM taskmembers tm
        WHERE tm.tasklist = $tasklist
    )";
    
    return executeSQLQueries($query);
}

function getChecklists (array $param) {
    $userId = infoCheck('id');
    $task = $param['task']??0;
    $isMaster = authCheck('master');
    
    if( !$isMaster && isTaskOf($userId, $task) ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $conn = connectDB();
    $query = " SELECT c.* FROM checklists c WHERE c.task = $task";
    
    return executeSQLQueries($query);
}

function getChecklistitems (array $param) {
    $userId = infoCheck('id');
    $checklist = $param['checklist']??0;
    $isMaster = authCheck('master');
    
    if( !$isMaster && isChecklistOf($userId, $checklist) ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $conn = connectDB();
    $query = " SELECT ci.* FROM checklistitems ci WHERE ci.checklist = $checklist";
    
    return executeSQLQueries($query);
}









/* 

  /   |\   |\   
 /_\  | \  | \  
/   \ |__\ |__\ 

*/

function createBoard($param){
    global $boardName;
    if(!authorizationCheck('master')){
        die( Error(1, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $result = advanceInsert('boards', $param);

    if( $result[0] ){
        die(Error(2, "failed to create $boardName " . $result[0]));
    }

    return $result[1]??null;
}

function createProject($param){
    global $boardName;
    if(!authCheck('manageTasks')){
        die( Error(1, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $result = advanceInsert('tasklists', $param);

    if( $result[0] ){
        die(Error(2, "failed to create $boardName " . $result[0]));
    }

    return $result[1]??null;
}

function createTasklist($param){
    global $tasklistName;
    if(!authorizationCheck('master')){
        die( Error(1, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $result = advanceInsert('tasklists', $param);

    if( $result[0] ){
        die(Error(2, "Failed to create $tasklistName " . $result[0]));
    }

    return $result[1]??null;
}

function addTaskmember($param){
    $isMaster = authCheck('master');
    $tasklist = (int) ( $param['tasklist']??0 );
    $user = (int) ( $param['user']?? NULL );
    
    if( !$isMaster ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    
    $result = advanceInsert('taskmembers', $param);

    if( $result[0] ){
        die(Error(2, "Failed to add task member " . $result[0]));
    }

    return $result[0]??true;
}

function createTask($param){
    global $tasklistName;
    if(!authorizationCheck('master') && isMemberOf(USER_INFO['id'], $param['tasklist'])!=1){
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $result = advanceInsert('tasks', $param);

    if( $result[0] ){
        die(Error(2, "Failed to create $tasklistName " . $result[0]));
    }

    return $result[1]??null;
}

function addChecklist($param){
    global $checklistName;
    $isMaster = authCheck('master');
    $task = (int) ( $param['task']??0 );
    $userId = infoCheck('id');
    
    if( !$isMaster && isTaskOf($userId, $task)!=1 ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    
    $result = advanceInsert('checklists', $param);

    if( $result[0] ){
        die(Error(2, "Failed to add $checklistName " . $result[0]));
    }

    return $result[1]??null;
}

function addChecklistitem($param){
    global $checklistitemName;
    $isMaster = authCheck('master');
    $checklist = (int) ( $param['checklist']??0 );
    $userId = infoCheck('id');
    
    if( !$isMaster && isChecklistOf($userId, $checklist)!=1 ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    
    $result = advanceInsert('checklistitems', $param);

    if( $result[0] ){
        die(Error(2, "Failed to add $checklistitemName " . $result[0]));
    }

    return $result[1]??null;
}





function calculateBoardProgress($boardId) {
    // Step 1: Fetch all tasks associated with the board
    $isMaster = authCheck('master');
    $userId = infoCheck('id');

    $conn = connectDB();
    $sql = "
        SELECT t.id, t.status
        FROM tasks t
        JOIN tasklists tl ON t.tasklist = tl.id
        WHERE tl.board = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $boardId);
    $stmt->execute();
    $tasks = $stmt->get_result();

    $totalTasks = $tasks->num_rows;
    if ($totalTasks === 0) {
        // No tasks, so progress is 0%
        return 0;
    }

    // Step 2: Calculate progress for each task
    $totalProgress = 0;
    while ($task = $tasks->fetch_assoc()) {
        $taskId = $task['id'];

        // If the task is "Done," its progress is 100%
        if ($task['status'] === "Done") {
            $totalProgress += 100;
            continue;
        }

        // Check if the task has checklists
        $sql = "SELECT id FROM checklists WHERE task = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $taskId);
        $stmt->execute();
        $checklists = $stmt->get_result();

        $totalChecklists = $checklists->num_rows;
        if ($totalChecklists === 0) {
            // No checklists, so the task progress is 0%
            continue;
        }

        // Calculate checklist progress
        $taskChecklistProgress = 0;
        while ($checklist = $checklists->fetch_assoc()) {
            $checklistId = $checklist['id'];

            // Get total items and completed items for the checklist
            $sql = "SELECT COUNT(*) AS totalItems, 
                           SUM(CASE WHEN isCompleted = TRUE THEN 1 ELSE 0 END) AS completedItems 
                    FROM checklistitems WHERE checklist = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $checklistId);
            $stmt->execute();
            $checklistProgress = $stmt->get_result()->fetch_assoc();

            if ($checklistProgress['totalItems'] > 0) {
                $progress = ($checklistProgress['completedItems'] / $checklistProgress['totalItems']) * 100;
                $taskChecklistProgress += $progress;
            }
        }

        // Average progress of all checklists for the task
        $taskProgress = $taskChecklistProgress / $totalChecklists;
        $totalProgress += $taskProgress;
    }

    // Step 3: Calculate average progress for the board
    $boardProgress = $totalProgress / $totalTasks;
    return $boardProgress;
}

function calculateTasklistProgress($tasklistId) {

    $isMaster = authCheck('master');
    $userId = infoCheck('id');
    if(!$isMaster && isMemberOf($userId, $tasklistId)!=1) {
        die( Error(2, "Unauthorized Access") );
    }

    $conn = connectDB();
    $sql = "
        SELECT id, status
        FROM tasks
        WHERE tasklist = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $tasklistId);
    $stmt->execute();
    $tasks = $stmt->get_result();

    $totalTasks = $tasks->num_rows;
    if ($totalTasks === 0) {
        // No tasks, so progress is 0%
        return 0;
    }

    // Step 2: Calculate progress for each task
    $totalProgress = 0;
    while ($task = $tasks->fetch_assoc()) {
        $taskId = $task['id'];

        // If the task is "Done," its progress is 100%
        if ($task['status'] === "Done") {
            $totalProgress += 100;
            continue;
        }

        // Check if the task has checklists
        $sql = "SELECT id FROM checklists WHERE task = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $taskId);
        $stmt->execute();
        $checklists = $stmt->get_result();

        $totalChecklists = $checklists->num_rows;
        if ($totalChecklists === 0) {
            // No checklists, so task progress is 0%
            continue;
        }

        // Calculate checklist progress
        $taskChecklistProgress = 0;
        while ($checklist = $checklists->fetch_assoc()) {
            $checklistId = $checklist['id'];

            // Get total items and completed items for the checklist
            $sql = "SELECT COUNT(*) AS totalItems, 
                           SUM(CASE WHEN isCompleted = TRUE THEN 1 ELSE 0 END) AS completedItems 
                    FROM checklistitems WHERE checklist = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $checklistId);
            $stmt->execute();
            $checklistProgress = $stmt->get_result()->fetch_assoc();

            if ($checklistProgress['totalItems'] > 0) {
                $progress = ($checklistProgress['completedItems'] / $checklistProgress['totalItems']) * 100;
                $taskChecklistProgress += $progress;
            }
        }

        // Average progress of all checklists for the task
        $taskProgress = $taskChecklistProgress / $totalChecklists;
        $totalProgress += $taskProgress;
    }

    // Step 3: Calculate average progress for the tasklist
    $tasklistProgress = $totalProgress / $totalTasks;
    return $tasklistProgress;
}

function calculateTaskProgress($taskId) {
    // Step 1: Check the task status
    $isMaster = authCheck('master');
    $userId = infoCheck('id');

    if(!$isMaster && isTaskOf($userId, $taskId)!=1) {
        die( Error(2, "Unauthorized Access") );
    }

    $conn = connectDB();
    $sql = "SELECT `status` FROM tasks WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    $result = $stmt->get_result();
    $task = $result->fetch_assoc();

    if (!$task) {
        return "Task not found";
    }

    // If the status is "Done", return 100%
    if ($task['status'] === "Done") {
        return 100;
    }

    // Step 2: Fetch associated checklists
    $sql = "SELECT id FROM checklists WHERE task = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    $checklists = $stmt->get_result();

    $totalChecklists = $checklists->num_rows;
    if ($totalChecklists === 0) {
        // No checklists, so progress is 0%
        return 0;
    }

    // Step 3: Calculate checklist progress based on checklistitems
    $totalProgress = 0;
    while ($checklist = $checklists->fetch_assoc()) {
        $checklistId = $checklist['id'];

        // Get total items and completed items for the checklist
        $sql = "SELECT COUNT(*) AS totalItems, 
                       SUM(CASE WHEN isCompleted = TRUE THEN 1 ELSE 0 END) AS completedItems 
                FROM checklistitems WHERE checklist = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $checklistId);
        $stmt->execute();
        $checklistProgress = $stmt->get_result()->fetch_assoc();

        if ($checklistProgress['totalItems'] > 0) {
            $progress = ($checklistProgress['completedItems'] / $checklistProgress['totalItems']) * 100;
            $totalProgress += $progress;
        }
    }

    // Step 4: Average checklist progress
    $taskProgress = $totalProgress / $totalChecklists;
    return $taskProgress;
}






/* 

|\   |~  |  |~  === |~
| \  |~  |  |~   |  |~
|__\ |_  |_ |_   |  |_

*/


function deleteTaskmember($param){
    $isMaster = authCheck('master');
    $tasklist = (int) ( $param['tasklist']??0 );
    
    if( !$isMaster ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $result = advanceDelete('taskmembers', $param);

    if( $result[0] ){
        die(Error(2, "Failed to remove task member " . $result[0]));
    }

    return $result[0]??true;
}

function deleteTask($param){
    global $taskName;
    $isMaster = authCheck('master');
    $userId = infoCheck('id');
    $tasklist = (int) ( $param['id']??0 );
    
    if( !$isMaster && isTaskOf($userId, $param['id'])!=1 ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $result = advanceDelete('tasks', $param);

    if( $result[0] ){
        die(Error(2, "Failed to delete $taskName " . $result[0]));
    }

    return $result[0]??true;
}

function deleteProject($param){
    global $tasklistName;
    $isMaster = authCheck('manageTasks');
    $tasklist = (int) ( $param['id']??0 );
    
    if( !$isMaster ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $result = advanceDelete('tasklists', $param);

    if( $result[0] ){
        die(Error(2, "Failed to delete $tasklistName " . $result[0]));
    }

    return $result[0]??true;
}

function deleteBoard($param){
    global $boardName;
    $isMaster = authCheck('master');
    
    if( !$isMaster ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $result = advanceDelete('boards', $param);

    if( $result[0] ){
        die(Error(2, "Failed to delete $boardName " . $result[0]));
    }

    return $result[0]??true;
}

function deleteChecklist($param){
    global $checklistName;
    $userId = infoCheck('id');
    $isMaster = authCheck('master');
    
    if( !$isMaster && isChecklistOf($userId, $param['id'])!=1 ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $result = advanceDelete('checklists', $param);

    if( $result[0] ){
        die(Error(2, "Failed to delete $checklistName " . $result[0]));
    }

    return $result[0]??true;
}

function deleteChecklistitem($param){
    global $checklistitemName;
    $userId = infoCheck('id');
    $isMaster = authCheck('master');
    
    if( !$isMaster && isChecklistitemOf($userId, $param['id'])!=1 ) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }

    $result = advanceDelete('checklistitems', $param);

    if( $result[0] ){
        die(Error(2, "Failed to delete $checklistitemName " . $result[0]));
    }

    return $result[0]??true;
}

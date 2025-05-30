<?php

function Users(array $param = [], array $filters = []){
    $userId = infoCheck('id');
    $isMaster = authCheck('master');
    $auth = authCheck('manageUser');

    $id = (int) ( $param['id']??0 );
    $auth2 = ($id == $userId);
    if(!$auth && !$isMaster && !$auth2) {
        die( Error(3, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    /* if(!$auth && !$isMaster){
        die( Error(3, "Una") );
    } */
    
    $offset = (int) ( $filters['step'] ?? null) * (int) ( $filters['size'] ?? null);
    $search = $filters['search']??null;
    // $searchin = 't.name';
    $size = $filters['size']??30;
    [$from, $to] = [$filters['from']??null, $filters['to']??null];
    $order = [$filters['orderby']??null, $filters['asc']??true];

    if($id) {
        [$err, $users] = advanceSelect('users', '*', ["id"=>$id]);
        $count = count($users);
    }else{
        [$err, $users] = advanceSelect('users', "id, accType, name, email, tel, Address, City, State, Country, DateCreated, valid, userVerified", [
            "__SEARCH"=> ["name"=>$search, "email"=>$search],
            "__LESSER"=>["DateCreated"=>$to],
            "__GREATER"=>["DateCreated"=>$from],
            "__ORDER"=>$order[0],
            "__ASC"=>$order[1]?"ASC":"DESC",
            "__LIMIT"=>$size,
            "__OFFSET"=>$offset,
            ...$param
        ]);

        [$err, $result] = advanceSelect('users', "COUNT(*) as count", [
            "__SEARCH"=> ["name"=>$search, "email"=>$search],
            "__LESSER"=>["DateCreated"=>$to],
            "__GREATER"=>["DateCreated"=>$from],
            // "__ORDER"=>$order[0],
            // "__ASC"=>$order[1]?"ASC":"DESC",
            // "__LIMIT"=>$size,
            // "__OFFSET"=>$offset,
            ...$param

        ]);
        $count = $result[0]['count'];
        // die(print_r($result));

    }
    return ["users"=>$users, "count"=>$count];

}

function getNonValid($filter){
    return Users([
        "valid" => TRUE
    ], $filter);
}

function getNonVerified($filter){
    return Users([
        "userVerified" => FALSE
    ], $filter);
}

function getVerified($filter){
    return Users([
        "userVerified" => TRUE
    ], $filter);
}

function getStaff($filter){
    return Users([
        "accType" => 'staff'
    ], $filter);
}

function getClients($filter){
    return Users([
        "accType" => 'client'
    ], $filter);
}

function editValid($id, $value){
    
}

function editVerified($id, $value){

}


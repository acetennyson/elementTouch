<?php

function executeSQLQueries($queryString) {

    $conn = connectDB();
    // Split the queries by semicolon
    $queries = explode(';', $queryString);
    $results = [];

    // Start a transaction
    mysqli_begin_transaction($conn);
    try {
        foreach ($queries as $query) {
            $query = trim($query);
            if (empty($query)) {
                continue;
            }
            // $query = mysqli_real_escape_string($conn, $query);

            $result = mysqli_query($conn, $query);

            if ($result) {
                if (stripos($query, 'SELECT') === 0) {
                    // Fetch the result for SELECT queries
                    $rows = [];
                    while ($row = mysqli_fetch_assoc($result)) {
                        array_push($rows, $row);
                    }
                    array_push($results, [
                        'query' => $query,
                        'result' => $rows,
                        'type' => 'select'
                    ]);
                } else {
                    // For other successful queries like INSERT, UPDATE, DELETE
                    $affectedRows = mysqli_affected_rows($conn);
                    array_push($results, [
                        'query' => $query,
                        'result' => "$affectedRows rows affected",
                        'type' => 'update'
                    ]);
                }
            } else {
                // If there's an error, rollback and stop further execution
                mysqli_rollback($conn);
                array_push($results, [
                    'query' => $query,
                    'result' => 'Error: ' . mysqli_error($conn),
                    'type' => 'error'
                ]);
                break;
            }
        }
    } catch (Exception $e) {

        array_push($results, [
            'query' => $query,
            'result' => 'Error: ' . $e->getMessage(),
            'type' => 'error'
        ]);
    }

    // If no errors, commit the transaction
    if (end($results)['type'] !== 'error') {
        mysqli_commit($conn);
    } else {
        mysqli_rollback($conn);
        die(Error(0, end($results)['result']));
    }

    return $results;
}

function advanceSelect($table, $selectable = '*', $condition = [], bool|mysqli $conn = null){

    $conn ??= connectDB();
    $whereClauses = [];
    $data = [];
    $table = mysqli_real_escape_string($conn, $table);
    $lesser = $condition['__LESSER']??[];
    $greater = $condition['__GREATER']??[];
    $between = $condition['__BETWEEN']??[];
    $search = $condition['__SEARCH']??["__CONJUNCTOR"=>"OR"];
    
    $lm = isset($condition['__LIMIT'])?$condition['__LIMIT']:null;
    $ofs = isset($condition['__OFFSET'])?$condition['__OFFSET']:null;
    $limit = '';
    if($lm) $limit = (" LIMIT $lm ").($ofs?" OFFSET $ofs":"");

    $ob = $condition['__ORDERBY']??null;
    $asc = $condition['__ASC']??"ASC";
    $orderby = '';
    if($ob) $orderby = " ORDER BY $ob $asc";
    
    if(count($lesser)) {
        foreach ($lesser as $key => $value) {
            $s = "";
            if( is_array($value) ){
                $s .= "(";
                for ($i=0; $i < count($value); $i++) { 
                    $mainvalue = $value[$i];
                    $s .= " $key <= ";
                    $s .= (is_string($mainvalue) ? "'$mainvalue'" : "$mainvalue");
                    $s .= ( $i == (count($value) - 1 ) ) ? "" : " OR";
                }
                $s .= ")";
            }else if(is_int($value) || !empty($value)) {
                $s .= " $key <= ";
                $s .= (is_string($value) ? "'$value'" : "$value");
            }
            if( !empty($s) ) $whereClauses[] = $s;
        }
    }

    if(count($greater)) {
        foreach ($greater as $key => $value) {
            $s = "";
            if( is_array($value) ){
                $s .= "(";
                for ($i=0; $i < count($value); $i++) { 
                    $mainvalue = $value[$i];
                    $s .= " $key >= ";
                    $s .= (is_string($mainvalue) ? "'$mainvalue'" : "$mainvalue");
                    $s .= ( $i == (count($value) - 1 ) ) ? "" : " OR";
                }
                $s .= ")";
            }else if(is_int($value) || !empty($value)){
                $s .= " $key >= ";
                $s .= (is_string($value) ? "'$value'" : "$value");
            }
            if( !empty($s) ) $whereClauses[] = $s;
        }
    }

    if(count($between)){
        $betweenConjunctor = $between["__CONJUNCTOR"]??"OR";
        $betweenArr = [];
        foreach ($between as $key => $value) {
            $s = "";
            if( is_array($value) && strpos($key, "__")===false){
                $minvalue = $value[0];
                $maxvalue = $value[1];
                $s .= "($key >= ";
                $s .= (is_string($minvalue) ? "'$minvalue'" : "$minvalue");
                $s .= " AND $key <= ";
                $s .= (is_string($maxvalue) ? "'$maxvalue'" : "$maxvalue");
                $s .= ")";
                $betweenArr[] = $s;
            }

        }
        $betweenString = implode(" $betweenConjunctor ", $betweenArr);
        if( !empty($betweenString) ) $whereClauses[] = "( $betweenString )";
    }

    $searchConjunctor = $search["__CONJUNCTOR"]??null;
    unset($search["__CONJUNCTOR"]);
    if(count($search)) {
        $arr = [];
        $searchConjunctor ??= "OR";
        foreach ($search as $key => $value) {
            if(is_string($value)) {
                $s = "( $key $value )";
                $arr[] = $s;
            }
        }
        if( count($arr) ) $whereClauses[] = implode(" $searchConjunctor ", $arr);
    }
    
    foreach ($condition as $column => $value) {
        $found = strpos($column, "__");
        if($found===false){
            $s = " $column ";
            $s .= is_null($value) ? "IS NULL" : (is_string($value) ? "= '$value'" : "= $value");
            $whereClauses[] = $s;
        }
    }
    $whereClause = implode(' AND ', $whereClauses);
    $where = count($whereClauses)?"WHERE":'';

    $query = "SELECT $selectable FROM $table $where $whereClause $orderby $limit";
    // die(print_r($whereClauses));
    // if($table=="users") die($query);
    try{
        // $result = mysqli_query($conn, " SELECT id, accType, name, email, tel, Address, City, State, Country, DateCreated, valid, userVerified FROM users WHERE  valid = '1'   LIMIT 10 ");
        $result = mysqli_query($conn, $query);
    }catch(Exception $e){
        die( Error(2, $e->getMessage()."$query" ) );
    }

    if(!$result){
        return [mysqli_error($conn), null];
    }
    
    if(mysqli_num_rows($result) > 0){
        while ($d = mysqli_fetch_assoc($result) ) {
            $data[] = $d;
        }
    }
    mysqli_close($conn);
    return [null, $data];
}

function advanceSelect2($table, $selectable = '*', $condition = [], bool|mysqli $conn = null){

    $values = [];
    $conn ??= connectDB();


    $whereClauses = [];
    foreach ($condition as $column => $value) {
        $whereClauses[] = "$column = ?";
        $values[] = $value || ' ';
    }
    $whereClause = implode(' AND ', $whereClauses);

    $query = " SELECT $selectable FROM $table WHERE $whereClause ";
    $result = mysqli_execute_query2($conn, $query, $values);

    if(!$result){
        // die(Error(2, 'unable to update industry'));
        return [mysqli_error($conn), null];
    }
    
    /* $data = [];
    if(mysqli_num_rows($result) > 0){
        while ($d = mysqli_fetch_assoc($result) ) {
            $data[] = $d;
        }
    } */
    mysqli_close($conn);
    return [null, $result];
}

function advanceUpdate($table, $param, $condition, bool|mysqli $conn = null){

    $conn ??= connectDB();
    $paramClauses = [];
    $whereClauses = [];
    try{
        $table = mysqli_real_escape_string($conn, $table);
    }catch(Exception $e){
        die( Error(2, $e->getMessage()) );
    }

    foreach ($param as $column => $value) {
        $s = "$column = ";
        $s .= is_null($value) ? "NULL" : (is_string($value) ? "'$value'" : (string) $value);
        $paramClauses[] = $s;
    }

    foreach ($condition as $column => $value) {
        $s = "$column ";
        $s .= is_null($value) ? "IS NULL" : (is_string($value) ? "= '$value'" : "= $value");
        $whereClauses[] = $s;
    }

    $whereClause = implode(' AND ', $whereClauses);
    $paramClause = implode(',', $paramClauses);
    // $paramClause = excludeString($paramClause, ',', -2);
    
    $query = " UPDATE $table SET $paramClause WHERE $whereClause ";
    // if($table=='tasklists') die(print_r([$query]));
    try{
        $result = mysqli_query($conn, $query);
    }catch(Exception $e){
        return [$e->getMessage(), null];
    }

    if(!$result){
        return [mysqli_error($conn), null];
    }
    
    $data = mysqli_affected_rows($conn);
    mysqli_close($conn);
    return [null, $data];
}

function advanceUpdate2($table, $param, $condition, bool|mysqli $conn = null){

    $setClauses = [];
    $values = [];
    $conn ??= connectDB();
    
    foreach ($param as $column => $value) {
        $setClauses[] = "$column = ?";
        $values[] = $value;
    }
    $setClause = implode(', ', $setClauses);

    $whereClauses = [];
    foreach ($condition as $column => $value) {
        $whereClauses[] = "$column = ?";
        $values[] = $value;
    }
    $whereClause = implode(' AND ', $whereClauses);

    $values = array_map(function( $val) use ($conn){
        return $val?mysqli_real_escape_string($conn, $val):NULL;
    }, $values);

    $query = "UPDATE $table SET $setClause WHERE $whereClause";
    // die( $query );
    $result = mysqli_execute_query2($conn, $query, $values);

    if(!$result){
        [mysqli_error($conn), null];
        // die(Error(2, 'unable to update industry'));
    }
    // $data =  ["row" => mysqli_affected_rows($conn), "message" => "industry updated"];
    $data = mysqli_affected_rows($conn);
    mysqli_close($conn);
    return [null, $data];

}

function advanceInsert($table, $param, bool|mysqli $conn = null){
    $conn ??= connectDB();

    $table = mysqli_real_escape_string($conn, $table);
    $columns = implode(',', array_keys($param));
    $placeholders = implode(',', array_fill(0, count($param), '?'));
    $values = array_values($param);
    $values = array_map(function( $val) use ($conn)
    {
        return is_null($val)?NULL:(is_string($val)?mysqli_real_escape_string($conn, $val):$val);
    }, $values);
    
    $query = "INSERT INTO $table ($columns) VALUES ($placeholders) ";

    $result = mysqli_execute_query2($conn, $query, $values);
    if (!$result) {
        // die(Error(2, 'Store Data'));
        return [mysqli_error($conn), null];
    }
    $data = mysqli_insert_id($conn);
    mysqli_close($conn);
    return [null, $data];
}

function advanceDelete($table, array $condition = [], bool|mysqli $conn = null){

    $conn ??= connectDB();
    $whereClauses = [];
    $table = mysqli_real_escape_string($conn, $table);

    foreach ($condition as $column => $value) {
        $s = "$column ";
        $s .= is_null($value) ? "IS NULL" : (is_string($value) ? "= '$value'" : "= $value");
        $whereClauses[] = $s;
    }

    $whereClause = implode(' AND ', $whereClauses);

    $query = " DELETE FROM $table WHERE $whereClause ";
    // die($query);
    try{
        $result = mysqli_query($conn, $query);
    }catch(Exception $e){
        return [$e->getMessage(), null];
    }

    if(!$result){
        return [mysqli_error($conn), null];
    }
    
    $data = mysqli_affected_rows($conn);
    mysqli_close($conn);
    return [null, $data];
}

function advanceDelete2($table, $condition, bool|mysqli $conn = null){

    $values = [];
    $conn ??= connectDB();

    $whereClauses = [];
    foreach ($condition as $column => $value) {
        $whereClauses[] = "$column = ?";
        $values[] = $value;
    }
    $whereClause = implode(' AND ', $whereClauses);

    $values = array_map(function( $val) use ($conn){
        return $val?mysqli_real_escape_string($conn, $val):NULL;
    }, $values);

    $query = "DELETE FROM $table WHERE $whereClause";
    $result = mysqli_execute_query2($conn, $query, $values);

    if(!$result){
        [mysqli_error($conn), null];
    }

    $data = mysqli_affected_rows($conn);
    mysqli_close($conn);
    return [null, $data];

}

if(!function_exists("mysqli_execute_query2")){
    function mysqli_execute_query2(mysqli $conn, string $query, array|null $param=null) {
        $stmt = $conn->prepare($query);
        if(!$stmt) die( Error(2, "Prepare failed ".htmlspecialchars($conn->error)) );

        if(!empty($param)) {
            $types = '';
            foreach ($param as $p) {
                if(is_int($p)){
                    $types .= 'i';
                } elseif (is_float($p)) {
                    $types .= 'd';
                } elseif (is_string($p)) {
                    $types .= 's';
                }else{
                    $types .= 'b';
                }
            }

            $stmt->bind_param($types, ...$param);
            try{
                if(!$stmt->execute()){
                    throw new Exception("Execute failed: " . htmlspecialchars($stmt->error), 1);                
                }
            }catch(Exception $e){
                die ( Error(1, 'Error: '.$e->getMessage()) );
            }

            $result = $stmt->get_result();
            $lastId = $stmt->insert_id;
            if($result){
                $data = $result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                return $data;
            }elseif ($lastId) {
                return $lastId;
            } else {
                $stmt->close();
                return $conn->affected_rows;
            }
        }
    }
}
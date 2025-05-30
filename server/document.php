<?php

function uploadFile($file, $dir = UPLOAD_DIR, array $allowedTypes = [], array $deniedTypes=[]){
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0777, true)) {
            return ["Internal server error: Unable to create directory.", null]; // Error Code 2: Internal error
        }
    }

    $fileType = mime_content_type($file['tmp_name']);
    // $fileType = $file['type'];
    if(in_array($fileType, $deniedTypes, true)){
        return ["File type $fileType not allowed", null];
    }

    if(count($allowedTypes) && !in_array($fileType, $allowedTypes, true)){
        return ["File type $fileType not allowed", null];
    }
    
    $fileName = preg_replace("/[^a-zA-Z0-9\.\-_]/", "", basename($file['name']));
    $targetFile = $dir . DIRECTORY_SEPARATOR . $fileName;
    if (file_exists($targetFile)) {
        return ["Sorry, ".htmlspecialchars($file['name'])." already exists.", null];
    }

    if ($file["size"] > 70e6) { // 70MB limit
        return ["File is too large.", null];
    }
    if (move_uploaded_file( $file['tmp_name'], $targetFile) ) {
        return [
            null,
            [ 'name'=>$fileName, "fileType"=>$fileType, "size"=>$file['size'], "date"=>date("Y-m-d H:i:s") ]
        ];
    }
    return [
        "Unable to upload $fileName",
        null
    ];
}

function uploadDocument($file, int | null $parent, $allowedTypes=[], $deniedTypes = []){
    
    if(!infoCheck('accType', 'staff')){
        die( Error(1, "Unauthorized Action", "id=" . (USER_INFO['id']??null)) );
    }
    $conn = connectDB();
    $userId = infoCheck('id');
    
    // $folderPath = is_array($folders) ? implode('/', $folders) : $folders;
    $targetDir = getFolderPath($parent, $conn);

    // Use the simplified uploadFile function
    [$err, $upload] = uploadFile($file, $targetDir, $allowedTypes, $deniedTypes);
    
    if($err){
        die( Error(3, "Error: $err") );
    }
    

    $params = [
        'name'    => $upload['name'],
        'type'    => 'file',
        // 'parent'  => $parentID,        // Set folder ID or null if root
        'creator' => $userId,
        'link'    => uniqid($userId),        // No shareable link by default
        'size'    => $upload['size'],
        'date'    => $upload['date'],
        'fileType' => $upload['fileType']
    ];

    if($parent) $params['parent'] = $parent;

    // Insert into the database using advanceInsert
    [$error, $insertId] = advanceInsert('document', $params, $conn);

    if ($error) {
        die( Error(0, "Database server error: Unable to save metadata. $error") );
    }

    return [...$params, "id"=>$insertId];
}

function revokeLink($documentId) {

    $params = ['link' => null];
    $condition = ['id' => $documentId];

    [$error, $rowsAffected] = advanceUpdate('document', $params, $condition);

    if ($error) {
        return Error(0, "Database server error: Unable to revoke link. $error");
    }

    return Result("Link revoked successfully", ['rows_affected' => $rowsAffected]);
}


function generateLink($documentId) {
    // Generate a random UUID
    $uuid = uniqid();

    $params = ['link' => $uuid];
    $condition = ['id' => $documentId];

    [$error, $rowsAffected] = advanceUpdate('document', $params, $condition);

    if ($error) {
        return Error(0, "Database server error: Unable to generate link. $error");
    }

    return Result("Link generated successfully", ['link' => $uuid, 'rows_affected' => $rowsAffected]);
}

function fetchDocuments(array $conditions = [], string $columns = "*") {
    [$error, $result] = advanceSelect('document', $columns, $conditions);
    // die(print_r($result));

    if ($error) {
        return [$error, null];
    }

    // The $result is assumed to already be an array of rows (processed in advanceSelect)
    $documents = is_array($result) ? $result : [];

    return [null, $documents];
}

function getDocumentsParent(int $parentId = null){
    $userId = infoCheck('id');
    $columns = "id, name, type, size, date, link"; // Specify the columns to retrieve
    $conditions = [
        'creator' => $userId,  // Add a creator constraint to restrict access
        'deleted IS NULL' => null // Ensure we only fetch non-deleted documents
    ];


    if ($parentId===null) {
        $conditions['parent IS NULL'] = null; // Fetch only root-level documents
    } else {
        $conditions['parent'] = $parentId; // Fetch children within the specific folder
    }
    return getDocuments($conditions);
}

function getDocuments($param) {
    // $columns = "id, name, type, size, date, creator, link"; // Columns to retrieve
    $p = $param;
    $link = $p['link']??null;
    $parent = $p['parent']??null;
    if(!$link){
        unset($p['link']);
        $p['creator'] = infoCheck('id');
    }
    if(!$parent){
        unset($p['parent']);
        $p['parent'] = null;
    }
    $conditions = [
        ...$p,
        'deleted' => null // Ensure the document is not deleted
    ];

    [$error, $docArray] = fetchDocuments($conditions);
    if($error){
        die( Error(0, "Database server error: Unable to fetch documents. $error") );
    }

    return $docArray;
}

function countFileContents($parentId) {
    if (empty($parentId)) {
        return Error(1, "Invalid folder ID. Please provide a valid parent ID.");
    }

    $columns = "COUNT(*) AS child_count"; // We only need the count
    $conditions = [
        'parent' => $parentId,
        'deleted' => null
    ];

    [$error, $result] = advanceSelect('document', $columns, $conditions);

    if ($error) {
        return Error(0, "Unable to count documents: $error");
    }

    $row = $result[0] ?? ['child_count' => 0];
    $childCount = $row['child_count'] ?? 0;

    return Result("Child count retrieved successfully", ['count' => $childCount]);
}


function getFolderPath($documentId, $conn) {
    // assume the root directory
    // $conn ??= connectDB();
    if (!$documentId) {
        // mysqli_close($conn);
        return UPLOAD_DIR; // Root folder path
    }

    // Query to fetch the parent details ( AND `type` = 'folder')
    $query = "SELECT id, name, parent FROM document WHERE id = ? AND deleted IS NULL";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $documentId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // mysqli_close($conn);
        // die( Error(0, $query) );
        return false; // Parent folder not found
    }

    $row = $result->fetch_assoc();
    $stmt->close();

    // Recursively resolve the parent folder path
    $parentPath = getFolderPath($row['parent'], $conn);

    // Return the resolved path by appending the folder name
    return $parentPath . DIRECTORY_SEPARATOR . $row['name'];
}

function getFolderPathRemake($parentId, $conn, string $attribute = "name", $arr = [], int $iterations = null ) {
    // If no parentId is provided, assume the root directory
    if (!$parentId) {
        return UPLOAD_DIR; // Root folder path (adjust to your needs)
    }

    // Query to fetch the parent folder's details
    $query = "SELECT id, name, parent FROM document WHERE id = ? AND type = 'folder' AND deleted IS NULL";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $parentId);
    $stmt->execute();
    $result = $stmt->get_result();

    // If the parent folder doesn't exist, return false
    if ($result->num_rows === 0) {
        return false; // Parent folder not found
    }

    $row = $result->fetch_assoc();
    $stmt->close();

    // Recursively resolve the parent folder path
    $data = getFolderPath($row['parent'], $conn);

    // Return the resolved path by appending the folder name
    array_unshift($arr, $data);
    return $arr;
}


function createDocument($param, $path='') {
    if(!isset($param, $param['name'], $param['type'])) die( Error(1, "Invalid parameter for creating document") );
    $userId = infoCheck('id');
    if (empty($param['name'])) {
        return Error(1, "Folder name cannot be empty."); // Error Code 1: Invalid input
    }
    if (empty($param['name'])) {
        return Error(1, "Folder name cannot be empty."); // Error Code 1: Invalid input
    }
    if (empty($userId)) {
        return Error(2, "Unauthorized. Please log in to create a folder."); // Error Code 2: Unauthorized
    }

    // Connect to the database
    $conn = connectDB();
    $param['creator'] = $userId;
    $parentId = $param['parent'] || null;
    $docName = $param['name'];
    $docType = $param['type'] || 'folder';
    // Determine the filesystem path for the folder
    $folderPath = $path?(UPLOAD_DIR.$path):getFolderPath($parentId, $conn); // Helper function to resolve the folder path
    if (!$folderPath) {
        return ["Parent folder does not exist or cannot be resolved.", null]; // Error Code 3: Parent not found
    }

    // Append the new folder's name to the path
    $newFolderPath = $folderPath . DIRECTORY_SEPARATOR . $docName;
    // die($newFolderPath);

    // Check if the folder already exists in the filesystem
    if (file_exists($newFolderPath)) {
        return ["A folder with the same name already exists in this location.", null]; // Error Code 4: Folder conflict
    }

    // Create the folder in the filesystem
    if($docType=='folder') {
        $bool = mkdir($newFolderPath, 0755, true);
        if (!$bool) { // 0755 permissions, recursive directory creation
            return ["Unable to create the folder in the filesystem.", null]; // Error Code 5: Filesystem error
        }
    }else if($docType=='file') {
        $bool = fopen($newFolderPath, 'w+');
        if (!$bool) { // 0755 permissions, recursive directory creation
            return ["Unable to create the folder in the filesystem.", null]; // Error Code 5: Filesystem error
        }
    }else{
        die( Error(1, "Invalid file type") );
    }
    if (!$parentId) {
        // delete($param['parent']);
        unset($param['parent']);
    }

    // Insert the folder into the Document table
    return advanceInsert('document', $param);
    // return Result("Folder created successfully.", ['folderId' => $folderId, 'path' => $newFolderPath]);

}

function updateDoc($id, $param, $conn = null){
    $conn ??= connectDB();
    $path = getFolderPath($id, $conn);
    if(!$path) die( Error(2, "Document not found") );
    // die($path);
    if($param['name']??false){
        $name = $param['name'];
        $basePath = getBasePath( $path, -2 );
        // die($basePath);
        $result = rename($path, $basePath . $name);
        if(!$result){
            $error = error_get_last();
            die( Error(2, $error) );
        }
    }
    
    [$error, $affectedRows] = advanceUpdate('document', $param, ["id"=>$id], $conn);
    if($error) die( Error(2, $error) );

    return $affectedRows;
}

function moveFile(string $from, string | null $to=null){
    // if(!)
}

function getBasePath(string $currentPath, int $seperatorPosition =-2 ){
    return excludeString($currentPath, DIRECTORY_SEPARATOR, $seperatorPosition ) . DIRECTORY_SEPARATOR;
}

function excludeString(string $currentPath, string $seperator, int $seperatorPosition = -1) {
    $pathSplit = explode($seperator, $currentPath);
    if($seperatorPosition < 0) $seperatorPosition += count($pathSplit);
    
    if($seperatorPosition < 0 || $seperatorPosition >= count($pathSplit)) $seperatorPosition = count($pathSplit) - 1;

    $basePath = implode($seperator, array_slice($pathSplit, 0, $seperatorPosition + 1) );
    return $basePath;
}

function getBasePath_OLD($currentPath){
    $lastSeperator = strrpos($currentPath, DIRECTORY_SEPARATOR);
    if($lastSeperator===false) return $currentPath;

    $basePath = substr($currentPath, 0, $lastSeperator + 1);
    return $basePath . DIRECTORY_SEPARATOR;
}





function isDocumentOf (int $userId, int $documentId) {
    # code...
    $conn = connectDB();
    $query = " SELECT * FROM document d
    WHERE d.id = $documentId AND d.creator = $userId ";
    $result = mysqli_query($conn, $query);
    if(!$result){
        return -1;
    }
    return mysqli_num_rows($result)?1:0;
}

function downloadFile($fileId, $conn) {
    $userId = infoCheck('id');
    $sql = "SELECT path, name, download 
            FROM document 
            WHERE id = ? AND creator = ? AND `type` = 'file' AND deleted IS NULL";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $fileId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($file = $result->fetch_assoc()) {
        if ($file['download'] === '0') {
            echo "Download not allowed for this file.";
            exit;
        }

        $filePath = $file['path'];
        $fileName = $file['name'];
        $fileType = $file['fileType'];
        if (file_exists($filePath)) {
            header('Content-Description: File Transfer');
            header("Content-Type: $fileType"); // application/octet-stream
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Content-Transfer-Encoding: binary');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
        }
    }
    echo "File not found!";
}
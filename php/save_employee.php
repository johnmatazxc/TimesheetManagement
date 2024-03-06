<?php
require_once '../config/config.php';

include(DB_PHP);

// Get JSON data from the request
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
        $emp_id = $data[EMPLOYEE_ID];
        $emp_name = $data[EMPLOYEE_NAME];
        $emp_start = $data[EMPLOYEE_START];
        $overtime = $data[EMPLOYEE_OVERTIME];

        //Perform a SQL INSERT query
        $query = "UPDATE " . DB_TABLE_EMPLOYEE .  
                  " SET " . EMPLOYEE_NAME . " = '$emp_name'," . EMPLOYEE_START . " = '$emp_start'," . EMPLOYEE_OVERTIME . " = '$overtime'
                  WHERE " . EMPLOYEE_ID . " = $emp_id";
 

        $result = mysqli_query($conn, $query);

        if ($result) {
            // Fetch the updated last_modified timestamp
            $fetchQuery = "SELECT " . EMPLOYEE_MODIFIED . " FROM " . DB_TABLE_EMPLOYEE .
                            " WHERE " . EMPLOYEE_ID . " = $emp_id";

            $fetchResult = mysqli_query($conn, $fetchQuery);

            if ($fetchResult) {
                $updatedTimestamp = mysqli_fetch_assoc($fetchResult)['modified'];
                echo json_encode(['status' => 'success', 'modified' => $updatedTimestamp]);
            } else {
                echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
        }

} else {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
}

mysqli_close($conn);
?>

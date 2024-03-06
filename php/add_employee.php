<?php

require_once '../config/config.php';

include(DB_PHP);



// Get JSON data from the request
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!empty($data)) {
    $employeeName = mysqli_real_escape_string($conn, $data[EMPLOYEE_NAME]);
    $overtimeEligible = mysqli_real_escape_string($conn, $data[EMPLOYEE_OVERTIME]);
    $startDate = mysqli_real_escape_string($conn, $data[EMPLOYEE_START]);
    $endDate = $data[EMPLOYEE_END] ? "'" . mysqli_real_escape_string($conn, $data[EMPLOYEE_END]) . "'" : "NULL";

    // Perform a SQL INSERT query
    $query = "INSERT INTO " . DB_TABLE_EMPLOYEE . " (" . EMPLOYEE_NAME . ", " . EMPLOYEE_OVERTIME . ", " . EMPLOYEE_START. ", " . EMPLOYEE_END . ")
              VALUES ('$employeeName', '$overtimeEligible', '$startDate', $endDate)";

    $result = mysqli_query($conn, $query);

    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'Employee data added successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
}

mysqli_close($conn);
?>
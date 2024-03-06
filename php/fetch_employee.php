<?php
require_once '../config/config.php';

include(DB_PHP);


// Fetch employee data from the database
$sql = "SELECT * FROM " . DB_TABLE_EMPLOYEE;
$result = $conn->query($sql);

$employee = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $employee[] = array(
            'empName' => $row[EMPLOYEE_NAME],
            'empId' => $row[EMPLOYEE_ID],
            'loginId' => $row[EMPLOYEE_LOGINID],
            'empStart' => $row[EMPLOYEE_START],
            'empEnd' => $row[EMPLOYEE_END],
            'overtime' => $row[EMPLOYEE_OVERTIME],
            'modified' => $row[EMPLOYEE_MODIFIED]
        );
    }
}

// Close the database connection
$conn->close();

// Return timesheet data as JSON
header('Content-Type: application/json');
echo json_encode($employee);
?>

<?php
require_once '../config/config.php';

include(DB_PHP);

// Get emp_id from the query string
$emp_id = isset($_GET['emp_id']) ? $_GET['emp_id'] : null;

// Prepare the SQL query
$sql = "SELECT timesheets.*, employees.emp_name 
        FROM timesheets 
        JOIN employees ON timesheets.emp_id = employees.emp_id";

// If emp_id is provided, add a WHERE clause
if ($emp_id !== null) {
    $sql .= " WHERE timesheets.emp_id = " . $emp_id;
}

$result = $conn->query($sql);
$timesheets = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $timesheets[] = array(
            'emp_name' => $row['emp_name'],
            'emp_id' => $row['emp_id'],
            'ts_date' => $row['ts_date'],
            'approved' => $row['ts_approved'],
            'modified' => $row['modified'],
            'ts_id' => $row['ts_id'],
            'start_time' => $row['start_time'],
            'end_time' => $row['end_time'],
            'hours' => $row['hours'],
            'minutes' => $row['minutes'],
            'overtime' => $row['overtime'],
        );
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($timesheets);
?>

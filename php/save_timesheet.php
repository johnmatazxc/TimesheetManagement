<?php
// Include db.php for database connection
require_once '../config/config.php';

include(DB_PHP);

// Check if data is received
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Extract data from POST
    $emp_id = $_POST['emp_id'];
    $ts_date = date('Y-m-d', strtotime($_POST['ts_date'])); // Convert to yyyy-mm-dd format
    $start_time = $_POST['start_time'];
    $end_time = $_POST['end_time'];
    $hours = (int)$_POST['hours'];
    $minutes = (int)$_POST['minutes'];
    $overtime = $_POST['overtime'] === 'Y' ? 'Y' : 'N'; // Ensure overtime is either 'Y' or 'N'
    $ts_approved = 'N';

    // Prepare SQL statement
    $stmt = $conn->prepare("INSERT INTO " . DB_TABLE_TIMESHEETS . " (emp_id, ts_date, start_time, end_time, hours, minutes, overtime, ts_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Bind parameters and execute
    $stmt->bind_param("isssiiss", $emp_id, $ts_date, $start_time, $end_time, $hours, $minutes, $overtime, $ts_approved);
    $stmt->execute();

    // Check for successful insertion
    if ($stmt->affected_rows > 0) {
        // Retrieve the last inserted ts_id
        $ts_id = $conn->insert_id;

        // Insert into timesheets_item
        $work_desc = json_decode($_POST['work_desc'], true); // Assuming work_desc is a JSON string
        foreach ($work_desc as $item) {
            if (!empty($item['description'])) {
                $time_from = $item['time_from'];
                $time_out = $item['time_out'];
                $description = $item['description'];

                $stmt_item = $conn->prepare("INSERT INTO " . DB_TABLE_TIMESHEETS_ITEM . " (ts_id, time_from, time_out, description) VALUES (?, ?, ?, ?)");
                $stmt_item->bind_param("isss", $ts_id, $time_from, $time_out, $description);
                $stmt_item->execute();
                $stmt_item->close();
            }
        }

        echo "Data saved successfully";
    } else {
        echo "Error in saving data";
    }
    $stmt->close();
} else {
    echo "No data received";
}

$conn->close();
?>
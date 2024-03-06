<?php
// Include the database connection file and configuration
require_once '../config/config.php';

include(DB_PHP);

// Check if the data is sent via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decode the JSON data to an associative array
    $data = json_decode(file_get_contents('php://input'), true);

    // Extract and typecast variables
    $ts_id = (int) $data['ts_id'];
    $hours = (int) $data['hours'];
    $minutes = (int) $data['minutes'];

    // Prepare the SQL query for updating timesheets
    $query = "UPDATE timesheets SET 
                  start_time = ?, 
                  end_time = ?, 
                  hours = ?, 
                  minutes = ?, 
                  ts_approved = ?, 
                  overtime = ? 
              WHERE ts_id = ?";

    // Prepare and execute the statement
    if ($stmt = $conn->prepare($query)) {
        $stmt->bind_param("ssiissi", $data['start_time'], $data['end_time'], $hours, $minutes, $data['ts_approved'], $data['overtime'], $ts_id);
        $stmt->execute();

        // Check for successful update
        if ($stmt->affected_rows > 0) {
            echo "Timesheet updated successfully.\n";
            processItems($data['items'], $conn);
        } else {
            echo "No changes were made to the timesheet.\n";
        }
        $stmt->close();
    } else {
        echo "Error preparing statement.\n";
    }
} else {
    echo "Invalid request method.\n";
}

// Close the database connection
$conn->close();

// Function to process items array
function processItems($items, $conn) {
    foreach ($items as $item) {
        $ts_id = (int) $item['ts_id'];
        $tr_id = (int) $item['tr_id'];

        if ($tr_id > 0) {
            updateItem($tr_id, $item['description'], $conn);
        } else {
            insertItem($ts_id, $item, $conn);
        }
    }
}

// Function to update an item
function updateItem($tr_id, $description, $conn) {
    $query = "UPDATE timesheets_items SET 
                description = ? 
              WHERE tr_id = ?";

    if ($stmt = $conn->prepare($query)) {
        $stmt->bind_param("si", $description, $tr_id);
        $stmt->execute();
        echo "Item with tr_id: $tr_id updated.\n";
        $stmt->close();
    }
}

// Function to insert an item
function insertItem($ts_id, $item, $conn) {
    $query = "INSERT INTO timesheets_items (ts_id, time_from, time_out, description) VALUES (?, ?, ?, ?)";
    if ($stmt = $conn->prepare($query)) {
        $stmt->bind_param("isss", $ts_id, $item['time_from'], $item['time_out'], $item['description']);
        $stmt->execute();
        echo "New item inserted.\n";
        $stmt->close();
    }
}
?>

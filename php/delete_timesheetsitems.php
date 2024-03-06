<?php
// Include the database connection file
require_once '../config/config.php';

include(DB_PHP);


// Check if ts_id is sent via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ts_id'])) {
    // Retrieve ts_id from POST request and sanitize it
    $ts_id = (int) $_POST['ts_id'];

    // Prepare the SQL query
    $query = "DELETE FROM timesheets_items WHERE ts_id = ?";

    // Prepare and execute the statement
    if ($stmt = $conn->prepare($query)) {
        $stmt->bind_param("i", $ts_id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo "Items deleted successfully.";
        } else {
            echo "No items found with the given ts_id or deletion failed.";
        }

        $stmt->close();
    } else {
        echo "Error preparing statement.";
    }
} else {
    echo "Invalid request method or ts_id not provided.";
}

// Close the database connection
$conn->close();
?>

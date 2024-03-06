<?php
require_once '../config/config.php';

include(DB_PHP);


header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['ts_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing ts_id']);
    exit;
}

// Convert ts_id to an integer to prevent SQL injection
$ts_id = intval($conn->real_escape_string($input['ts_id']));

// Prepare and execute the query
$query = "SELECT * FROM timesheets_items WHERE ts_id = $ts_id";
$result = $conn->query($query);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    exit;
}

// Fetch the results
$results = $result->fetch_all(MYSQLI_ASSOC);

// Send the results back as JSON
echo json_encode($results);

// Close the connection
$conn->close();
?>

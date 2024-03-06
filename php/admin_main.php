<?php
session_start();

// Check if the user is not authenticated
if (!isset($_SESSION["login_id"])) {
    header("Location: login.php");
    exit();
}

$login_id = $_SESSION["login_id"];
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Timesheet App</title>
    <link rel="stylesheet" href="../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">

    <!-- kendo ui css -->
    <link rel="stylesheet" href="../assets/css/default-main.css">
</head>

<body>
    <nav class="navbar navbar-expand-lg navbar-container">
        <div class="container-fluid">
            <a class="navbar-brand text-white" href="#">Timesheet App  ( ADMIN )</a>

            <!-- Use a flex container for the "Login ID" text and logout button -->
            <div class="navbar-content">
                <span class="navbar-text white-text">Login ID: <span id="loginId" class="navbar-text fw-bold text-white"><?php echo $login_id; ?></span></span>
                <!-- Use an icon for the logout button -->
                <button id="logoutBtn" class="btn btn-danger"><i class="fas fa-sign-out-alt"></i></button>
            </div>
        </div>
    </nav>

    <!-- Tabs Content -->
    <div class="container mt-5">
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#timesheets">Timesheets</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#employee" id="employeeTab">Employee</a>
            </li>

            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#csvBackup">CSV Backup</a>
            </li>
        </ul>

        <div class="tab-content mt-2">
            <!-- Timesheets Tab Content -->
            <div class="tab-pane fade show active" id="timesheets">
                <!-- Include your Timesheets content here or load it dynamically using JavaScript -->
            </div>

            <!-- Employee Tab Content -->
            <div class="tab-pane fade" id="employee">
                <!-- Include your Employee content here or load it dynamically using JavaScript -->
            </div>

            <!-- CSV Backup Tab Content -->
            <div class="tab-pane fade" id="csvBackup">
                <!-- Include your CSV Backup content here or load it dynamically using JavaScript -->
            </div>
        </div>
    </div>

    <script src="../assets/js/jquery-3.6.0.min.js"></script>
    <script src="../assets/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/js/all.min.js"></script>
    <script type="module" src="../assets/js/app.js"></script>

    <!-- kendo ui js -->
    <script src="../assets/js/kendo.all.min.js"></script>
    <script src="../assets/js/kendo-ui-license.js"></script>

</body>

</html>

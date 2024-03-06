<?php
session_start();

require_once '../config/config.php';

include(DB_PHP);

function redirect($page)
{
    header("Location: $page");
    exit();
}



if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['login_id'], $_POST['password'])) {
        // Admin login
        $login_id = $_POST['login_id'];
        $password = $_POST['password'];

        $hashed_password = md5($password);

        $stmt = $conn->prepare("SELECT * FROM users WHERE login_id = ? AND password = ?");
        $stmt->bind_param("ss", $login_id, $hashed_password);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $_SESSION["login_id"] = $login_id;
            redirect("admin_main.php");
        } else {
            $error_message = "Invalid username or password";
        }

        $stmt->close();
    } elseif (isset($_POST['employeeId'])) {
        // Employee login
        $employeeId = $_POST['employeeId'];

        $stmt = $conn->prepare("SELECT emp_id, emp_name FROM employees WHERE emp_id = ?");
        $stmt->bind_param("s", $employeeId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $_SESSION["emp_id"] = $row['emp_id'];
            $_SESSION["emp_name"] = $row['emp_name'];
            redirect("emp_main.php");
        } else {
            $error_message = "Invalid employee ID";
        }


        $stmt->close();
    }
}

handleRegistration($conn);

function handleRegistration($conn) {
    if(isset($_POST['login_id_register'], $_POST['password_register'])) {
        $login_id_register = $_POST['login_id_register'];
        $password_register = $_POST['password_register'];

        // Check if the login ID exists
        $stmt = $conn->prepare("SELECT * FROM users WHERE login_id = ?");
        $stmt->bind_param("s", $login_id_register);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            echo "<p class='error'>User already exists!</p>";
        } else {
            // Hash the password and insert the new user
            $hashed_password = md5($password_register);
            $insert_stmt = $conn->prepare("INSERT INTO users (login_id, password) VALUES (?, ?)");
            $insert_stmt->bind_param("ss", $login_id_register, $hashed_password);
            $insert_stmt->execute();
            if($insert_stmt->affected_rows > 0) {
                $success_message = "Registration successful!";
            } else {
                $error_message = "Registration failed!";
            }
            $insert_stmt->close();
        }
        $stmt->close();
    }
}

?>



<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/login-style.css">
    <title>Timesheet Login Page</title>
</head>

<body>

    <div class="container" id="container">
        <div class="form-container sign-up">
            <div class="form">
                <div class="text-center mb-5">
                    <img src="../assets/img/logo.png" alt="Logo" class="logo img-fluid">
                </div>
                <h2>Create Account</h2>
                <form method="POST" action="">
                    <input type="text" placeholder="User" id="login_id_register" name="login_id_register" required>
                    <input type="password" placeholder="Password" id="password_register" name="password_register" required>
                    <button type="submit">Sign Up</button>

                    <?php
                // Display error message if login fails
                if (isset($success_message)) {
                    echo "<p class='success'>$success_message</p>";
                }
                ?>
                </form>
            </div>
        </div>
        <div class="form-container sign-in">
            <div class="form">
                <div class="text-center mb-5">
                    <img src="../assets/img/logo.png" alt="Logo" class="logo img-fluid">
                </div>
                <h2>Admin Login</h2>
                <form id="loginForm" method="POST" action="">
                    <input type="text" placeholder="User" id="login_id" name="login_id" required>
                    <input type="password" placeholder="Password" id="password" name="password" required>
                    <i class="fas fa-eye password-icon" id="togglePassword"></i>
                    <div class="form-links">
                        <a href="#" class="signup-link" id="register">Register an account</a>
                        <a href="#">Forget Password</a>
                    </div>
                    <button type="submit" class="login-button" id="loginBtn">Sign In</button>
                </form>

                <?php
                // Display error message if login fails
                if (isset($error_message)) {
                    echo "<p class='error'>$error_message</p>";
                }
                ?>

            </div>
        </div>
        <div class="toggle-container">
            <div class="toggle">
                <div class="toggle-panel toggle-left">
                    <h1>Welcome Back!</h1>
                    <p>Already have an account</p>
                    <button class="hidden" id="signIn">Sign In</button>
                </div>
                <div class="toggle-panel toggle-right">
                    <h1 class="employeePageTitle">Go to Employee Page</h1>
                    <!-- Employee login form -->
                    <form id="employeeLoginForm" method="POST" action="">
                        <label for="employeeId">Enter your Employee ID: </label>
                        <input type="text" placeholder="Enter Employee Code" id="employeeId" name="employeeId">
                        <!-- Update the button id to match the PHP condition -->
                        <button type="submit" class="hidden" id="loginEmployee">Log in as Employee</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="../assets/js/jquery-3.6.0.min.js"></script>
    <script src="../assets/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js"></script>
    <script type="module" src="../assets/js/login.js"></script>

</body>

</html>

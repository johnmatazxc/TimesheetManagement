<?php

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', 'P@ssw0rd');
define('DB_NAME', 'practicum-timesheetapp');
define('DB_TABLE_EMPLOYEE', 'employees');
define('DB_TABLE_TIMESHEETS', 'timesheets');
define('DB_TABLE_TIMESHEETS_ITEM', 'timesheets_items');
define('DB_PHP', 'db.php');


// Employee Table Column Name
define('EMPLOYEE_ID', 'emp_id');
define('EMPLOYEE_NAME', 'emp_name');
define('EMPLOYEE_LOGINID', 'login_id');
define('EMPLOYEE_OVERTIME', 'overtime');
define('EMPLOYEE_START', 'emp_start');
define('EMPLOYEE_END', 'emp_end');
define('EMPLOYEE_MODIFIED', 'modified');


// TIMESHEETS Table Column Name
define('TIMESHEETS_ID', 'ts_id');
define('TIMESHEETS_EMPID', 'emp_id');
define('TIMESHEETS_DATE', 'ts_date');
define('TIMESHEETS_APPROVED', 'ts_approved');
define('TIMESHEETS_START', 'start_time');
define('TIMESHEETS_END', 'end_time');
define('TIMESHEETS_HOURS', 'hours');
define('TIMESHEETS_MINUTES', 'minutes');
define('TIMESHEETS_OVERTIME', 'overtime');
define('TIMESHEETS_MODIFIED', 'modified');






?>
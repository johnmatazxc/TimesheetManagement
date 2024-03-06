// import config
import config from '../../config/config.js';


$(document).ready(function() {
    loadPages();

});

const loadPages = () => {
    console.log("HERE");
    $('#timesheets').load(config.timesheetsHtml, () => {
        displayTimesheets();
        $('#viewTimesheetBodyWorkDesc').kendoForm(workDescConfig);
        $('#refreshTimesheets').click(function() {
            timesheetsheet_data.read();
            $('#timesheetsTableBody').data('kendoGrid').refresh();
        });

    });

    $('#employee').load(config.employeeHtml, () => {
        displayEmployee();
        $('#refreshEmployee').click(function() {
            employee_data.read();
            $('#employeeTableBody').data('kendoGrid').refresh();
        });

        employeeEvents();
    });

    // Logout the current user and redirect to login.php
    $("#logoutBtn").on("click", function() {
        $.ajax({
            type: "GET",
            url: "logout.php",
            success: function (response) {
                window.location.href = "login.php";
            },
            error: function (error) {
                console.error("Error during logout:", error);
       
            }
        });
    });
};

// Fetch and display employee data
const fetchAndDisplayEmployee = (path) => {
    fetchData(path)
        .then((data) => {
            displayEmployee(data);
        })
        .catch((error) => {
            console.error('Error fetching:', error);
        });
}

// Fetch and display timesheet data
const fetchAndDisplayTimesheet = (path) => {
    fetchData(path)
        .then((data) => {
            displayTimesheets(data);
        })
        .catch((error) => {
            console.error('Error fetching:', error);
        });
}


const fetchData = (path) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: path,
            method: 'GET',
            success: function(response) {
                // Resolve the promise with the data
                resolve(response);
            },
            error: function(error) {
                reject(error);
            }
        });
    });

}

const getData = (path, maxPageSize, empId) => {
    return new kendo.data.DataSource({
        transport: {
            read: {
                url: path, // Your server-side PHP file
                dataType: 'json',
                data: {
                    emp_id: empId // Sending emp_id to the server
                }
            }
        },
        pageSize: maxPageSize
    });
} 

const getDataEmployee = (path, maxPageSize) => {
    return new kendo.data.DataSource({
        transport: {
            read: {
                url: path, // Your server-side PHP file
                dataType: 'json'
            }
        },
        pageSize: maxPageSize,
        schema: {

            model: {
                fields: {
                    empId: { editable: false },   
                    empStart: { type: "date"},
                }
            }
            
        }
    });
} 

const timesheetsheet_data = getData(config.fetchTimesheetsPhp, 20);
const displayTimesheets = () => {
    $('#timesheetsTableBody').kendoGrid({
        dataSource: timesheetsheet_data,
        scrollable: true,
        sortable: true,
        pageable: true,
        columns: [
            { field: "emp_id", title: "Employee ID", editable: false },
            { field: "emp_name", title: "Employee Name", editable: false },
            { field: "ts_date", title: "Timesheet Date", format: "{0:d}" },
            { field: "approved", title: "Approved" },
            { field: "modified", title: "Last Modified" },
            {
                command: { text: "View", click: toggleScreens }, title: " ", width: "180px",
            },
       
        ],
    });
    
}

const employee_data = getDataEmployee(config.fetchEmployeesPhp, 20);
const displayEmployee = () => {
    // Initialize Kendo UI Grid
    $('#employeeTableBody').kendoGrid({
        dataSource: employee_data,
        scrollable: true,
        sortable: true,
        pageable: true,
        editable: "inline",
        columns: [
            { field: "empId", title: "Employee ID", editable: false },
            { field: "empName", title: "Employee Name" },
            { field: "empStart", title: "Start Date", format: "{0:d}" },
            { field: "overtime", 
            title: "Overtime", 
            editor: function(container, options) {
                $('<select name="' + options.field + '"><option value="Y">Y</option><option value="N">N</option></select>').appendTo(container);
            } },
            { field: "modified", title: "Modified" },
            { command: ["edit"], title: "&nbsp;", width: "250px"  }
        ]
    });
};

const getDataItem = async (e) => {
    e.preventDefault();

    // Get a reference to the grid
    let grid = $("#timesheetsTableBody").data("kendoGrid");

    // Get the data item for the clicked row
    let dataItem = grid.dataItem($(e.currentTarget).closest("tr"));

    try {
        const response = await fetchTimesheetsItems(dataItem.ts_id);
        dataItem.items = response;
    } catch (error) {
        console.error('Error fetching:', error);
    }

    return dataItem;
    // Add your logic here, for example, call toggleScreens
}

const fetchTimesheetsItems = (ts_id) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: config.fetchTimesheetsItemsPhp, // Make sure this URL is correctly set in your config
            data: JSON.stringify({ ts_id: ts_id }), // Convert data to a JSON string
            contentType: "application/json", // Set the content type to JSON
            dataType: "json", // Expect a JSON response
            success: function(response) {
                // Resolve the promise with the data
                resolve(response);
            },
            error: function(error) {
                reject(error);
            }// Handle error - you can replace this with any error message or action
        });
    });
}

let retrieveItems = "";
let iteration = "";
let changedTime = false;

const toggleScreens = async (e) => {
    console.log("1st = " + retrieveItems);
    let dataItem = await getDataItem(e);
    console.log(dataItem);
    loadViewTimesheet(dataItem);

    // View Timesheet, Work Description
    iteration = parseInt(dataItem.hours, 10);
    let workDescFields = generateWorkDescField(iteration, true);
    let formData = generateTimeSlotsFromDB(iteration, dataItem);
    addItemsToWorkDescription(workDescFields, "#viewTimesheetBodyWorkDesc", formData);
    retrieveItems = formData;
    console.log("2nd = " + JSON.stringify(retrieveItems));

    $('#approveCheckbox').kendoCheckBox({
        size: "medium",
        rounded: "full",
        checked: isApproved(dataItem),
    });

    $("#saveChangesBtn").on("click", () => {
        var data1 = $("#viewTimesheetBody").data('kendoGrid');

        // Get the data items (rows) from the grid's data source
        var dataItem = data1.dataSource.data()[0];
        
        console.log("GRIDss ", dataItem);
        console.log("DATA ITEMS " + JSON.stringify(dataItem.items));

        for (let i = 1; i <= iteration; i++) {
            let timeFromField = `time_from${i}`;
            let timeOutField = `time_out${i}`;
            let descriptionField = `description${i}`;

            let formTimeFrom = formatTime1(convertStringToDate($("#viewTimesheetBodyWorkDesc").find(`[name='${timeFromField}']`).val()));
            let formTimeOut = formatTime1(convertStringToDate($("#viewTimesheetBodyWorkDesc").find(`[name='${timeOutField}']`).val()));
            let formDesc = $("#viewTimesheetBodyWorkDesc").find(`[name='${descriptionField}']`).val();

            console.log("JOHN");
            console.log(formTimeFrom);
            console.log(formTimeOut);
            

            let matchingObject = dataItem.items.find(obj => obj.time_from === formTimeFrom && obj.time_out === formTimeOut);
            console.log(matchingObject);

            if (matchingObject) {
                matchingObject.description = formDesc;
            } else {
                if (formDesc !== "") {
                    let newObject = {
                        tr_id: "0",
                        ts_id: dataItem.ts_id,
                                                  time_from: formTimeFrom,
                        time_out: formTimeOut,
                        description: formDesc
                    };
                    dataItem.items.push(newObject);
                }   
            }
        }

        
        dataItem.ts_approved = (isKendoCheckBoxChecked()? "Y" : "N");

        if (changedTime) {
            dataItem.start_time = new Date(dataItem.start_time).toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", hour12: false });
            dataItem.end_time = new Date(dataItem.end_time).toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", hour12: false });
            let timeDiff = calculateTimeDiff(dataItem.start_time, dataItem.end_time);
            dataItem.hours = timeDiff.hours;
            dataItem.minutes = timeDiff.minutes;
            dataItem.overtime = timeDiff.hours > 8 ? 'Y' : 'N';

            deleteTimesheet(dataItem);

        }

        console.log(JSON.stringify(dataItem));
        console.log(dataItem.items);
        console.log(dataItem.ts_id);

        // Clear data Item
        
        updateTimesheet(dataItem);
        dataItem = {};

        // Return to view timesheet page
        goBackViewTimesheetPage();

    });

    const $timesheetScreen = $('#timesheetScreen');
    const $viewTimesheetScreen = $('#viewTimesheetScreen');
    const $spinnerOverlay = $('#spinnerOverlay');

    // Show overlay with spinner
    $spinnerOverlay.fadeIn();

    // Simulate loading and toggle screens
    setTimeout(() => {
        // Hide overlay with spinner
        $spinnerOverlay.fadeOut();

        // Toggle screens with fade effect
        if ($timesheetScreen.is(':visible')) {
            $timesheetScreen.fadeOut(() => $viewTimesheetScreen.fadeIn());
        } else {
            $viewTimesheetScreen.fadeOut(() => $timesheetScreen.fadeIn());
        }
    }, 500); // Adjust the duration according to your needs
};

const isApproved = (dataItem) => {
    return dataItem.approved === "Y"? true : false;
}

const isKendoCheckBoxChecked = () => {
    var checkBox = $("#approveCheckbox").data("kendoCheckBox");
    console.log("Is Approved? " + checkBox.check());
    return checkBox.check();
}

const loadViewTimesheet = (dataItem) => {
    $("#viewTimesheetBody").kendoGrid({
        dataSource: {
            data: dataItem,
            schema: {
                model: {
                    fields: {
                        emp_name: { type: "string", editable: false },
                        ts_date: { type: "Date", editable: false },
                   
                    }
                }
            },
        },
        editable: "incell",
        columns: [
            { field: "emp_name", title: "Employee Name", width: "130px",  editable: false },
            { field: "ts_date", title: "Timesheet Date", format: "{0:yyyy-MM-dd}", width: "130px",  editable: false},
            { field: "start_time", title: "Shift Start", width: "130px", format: "{0:HH:mm}",
                editor: function (container, options) {
                timeEditor(container, options, "start_time");
            } },
            { field: "end_time", title: "Shift End", width: "130px", format: "{0:HH:mm}",
                editor: function (container, options) {
                timeEditor(container, options, "end_time");
            } }
        ]
        
    });


    $('#backButton').on("click", () => {
        goBackViewTimesheetPage();
    });

   
}

const goBackViewTimesheetPage = () => {
    if ($('#viewTimesheetBody').data("kendoGrid")) {
        $('#viewTimesheetBody').data("kendoGrid").destroy();
    }
    $('#viewTimesheetBody').empty();

    $('#approveCheckbox').kendoCheckBox().data("kendoCheckBox").destroy();
    $('#approveCheckbox').empty();

    $('#viewTimesheetScreen').hide();
    $('#timesheetScreen').show();

    timesheetsheet_data.read();
    $('#timesheetsTableBody').data('kendoGrid').refresh();
}


const timeEditor = (container, options, id) => {
    // Create a timepicker element
    let timepicker = $("<input required name='" + options.field + "' id='" + id + "' />").appendTo(container).kendoTimePicker({
        format: "HH:mm", // Time format
        value: options.model[options.field]
    }).data("kendoTimePicker");

    timepicker.bind("change", function () {
        changedTime = true;
        let timeDifference = calculateTimeDifference();
        iteration = timeDifference;

        if (timeDifference > 0) {
            var grid = $("#viewTimesheetBody").data("kendoGrid");
            var data = grid.dataSource.data()[0];
            let startTime = new Date(data.start_time).toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", hour12: true });
    
            let workDescFields = generateWorkDescField(timeDifference, true);
            let timeSlots = generateTimeSlots(timeDifference, startTime);
            addItemsToWorkDescription(workDescFields, "#viewTimesheetBodyWorkDesc", timeSlots);

            console.log("CHAM: ");
            data.items = [];

        }

    });

}

const calculateTimeDifference = () => {   
    var grid = $("#viewTimesheetBody").data("kendoGrid");
    var data = grid.dataSource.data(); // Use .data() for all records, not just those in the current view

    var startTime = new Date(data.map(item => item.start_time));
    
    var endTime = new Date(data.map(item => item.end_time));
    
    console.log("Start Times: ", startTime);
    console.log("End Times: ", endTime);

    if (startTime && endTime) {
        // Convert times to milliseconds and calculate the difference
        let differenceInMilliseconds = endTime.getTime() - startTime.getTime();

        // Convert milliseconds to hours (1 hour = 3600000 milliseconds)
        let differenceInHours = differenceInMilliseconds / 3600000;

        // Round to nearest whole number
        return Math.round(differenceInHours);
    } 
        // Return 0 or handle invalid time inputs appropriately
    return 0;
   
};

const calculateTimeDiff = (startTime, endTime) => {
    var start = convertStringToDate(startTime);
    var end = convertStringToDate(endTime);

    var diff = end - start;
    var hours = Math.floor(diff / 3600000); // milliseconds to hours
    var minutes = Math.round((diff % 3600000) / 60000); // remainder to minutes

    // If the duration is negative, it implies the end time is on the next day
    if (diff < 0) {
        hours += 24;
    }

    return { hours, minutes };
}

const parseTime12hrFormat = (timeString) => {
    var time = timeString.match(/(\d+):(\d+)/);
    var hours = parseInt(time[1]);
    var minutes = parseInt(time[2]);

    return new Date('1970-01-01 ' + hours + ':' + minutes);
}

const workDescConfig = {
    orientation: "vertical",
    scrollable: true,
    items: [
        {
            type: "group",
            label: "Work Description",
            layout: "grid",
            grid: { cols: 5, gutter: 10 },
            items: [] // Initially empty, items will be added dynamically
        }
    ],
};

const addItemsToWorkDescription = (newItems, element, formData) => {
    let elem = $(element);
    let kendoForm = elem.getKendoForm();
    if (kendoForm !== undefined) {
        elem.getKendoForm().destroy();
        elem.empty();
    }

    workDescConfig.formData = formData;
    let workDescriptionGroup = workDescConfig.items.find(group => group.label === "Work Description");
    if (workDescriptionGroup) {
        workDescriptionGroup.items = newItems;

        // Reinitialize Kendo Form, and set the form data
        elem.kendoForm(workDescConfig);
        elem.getKendoForm()
            .setOptions({ formData: workDescConfig.formData });

        // Hide the save and clear button for the kendo ui
        $('.k-form-clear, .k-form-submit').hide();
        $('.k-form-clear, .k-form-submit').css('display', 'none');
    }
}

const employeeEvents = () => {
    $("#addEmployeeMdl").on("click", function () {
        $("#addEmployeeModal").modal("show");
    });

    $("#closeEmployeeModalBtn").on("click", function () {
        $("#addEmployeeModal").modal("hide");
    });

    $("#addEmployeeBtn").on("click", function() {
        addEmployee();
    });
}

// Generate the work descripton field
const generateWorkDescField = (iterations, isReadOnly) => {
    var fields = [];

    for (var i = 1; i <= iterations; i++) {
        fields.push(
            { field: "time_from" + i, label: "From : ", editor: "TextBox", editorOptions: { readonly: isReadOnly, css: isReadOnly }, colSpan: 1 },
            { field: "time_out" + i, label: "To : ", editor: "TextBox", editorOptions: { readonly: isReadOnly }, colSpan: 1 },
            { field: "description" + i, label: "Description : ", editor: "TextBox", colSpan: 3 }
        );
    }

    return fields;
}

const generateTimeSlots = (iterations, startTimeStr) => {
    let timeSlots = {};
    let currentTime = convertStringToDate(startTimeStr);

    for (let i = 1; i <= iterations; i++) {
        timeSlots['time_from' + i] = formatTime(currentTime);

        // Calculate 'to' time (one hour ahead)
        currentTime = new Date(currentTime.getTime() + 60 * 60000); // Add 1 hour
        timeSlots['time_out' + i] = formatTime(currentTime);
    }

    return timeSlots;
}

const generateTimeSlotsFromDB = (iterations, dataItem) => {
    let timeSlots = {};
    let currentTime = convertStringToDate(dataItem.start_time);

    for (let i = 1; i <= iterations; i++) {
        let formattedTimeFrom = formatTime(currentTime);
        let timeFrom = formatTime1(currentTime);
        let timeFromKey = 'time_from' + i;

        console.log("Formatted: " + formattedTimeFrom);
        console.log("Not: " + dataItem.start_time);

        // Calculate 'to' time (one hour ahead)
        currentTime = new Date(currentTime.getTime() + 60 * 60000); // Add 1 hour
        let formattedTimeTo = formatTime(currentTime);
        let timeTo = formatTime1(currentTime);
        let timeToKey = 'time_out' + i;

        // Check if time_from and time_out match with any item in dataItem.items
        let matchingItem = dataItem.items.find(item => item.time_from === timeFrom && item.time_out === timeTo);

        if (matchingItem) {
            // If both time_from and time_out match, set the description
            timeSlots[timeFromKey] = formattedTimeFrom;
            timeSlots[timeToKey] = formattedTimeTo;
            timeSlots['description' + i] = matchingItem.description;
        } else {
            // If no match, just set time_from and time_out
            timeSlots[timeFromKey] = formattedTimeFrom;
            timeSlots[timeToKey] = formattedTimeTo;
        }
    }

    return timeSlots;
};

const convertStringToDate = (timeString) => {
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    hours = parseInt(hours);
    if (modifier === 'PM' && hours < 12) {
        hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }

    const dateTimeString = dateString + ' ' + hours + ':' + minutes;
    return new Date(dateTimeString);
}

const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;

    const strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

const formatTime1 = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;

    const strTime = hours + ':' + minutes;
    return strTime;
}


const saveRow = (row) => {
    let cells = row.find('td');
    let editedData = {}
    let empId = parseInt(row.find('td.emp_id').text(), 10);

    editedData['emp_id'] = empId;

    // Replace each input field with its value
    cells.each(function() {
        let content;
        let input = $(this).find('input');
        let select = $(this).find('select');
        let columnName = $(this).closest('td').attr('class');

        if (input.length > 0) {
            content = input.val();
            editedData[columnName] = content;
        } else if (select.length > 0) {
            content = select.val();
            editedData[columnName] = content;
        }
        
        $(this).html(content);

    });

    saveData(config.saveEmployeesPhp, editedData)
        .then((data) => {
            row.find('td.modified').text(data.modified);
            row.find('.saveBtn').parent().remove();   
        })
        .catch((error) => {
            console.error('Error fetching:', error);
        });
}

const saveData = (path, editedData) => {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: path,
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(editedData),
            success: function(data) {
                resolve(data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

const updateData = (path, editedData) => {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: path,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(editedData),
            success: function(data) {
                console.log("OK " + data);
                resolve(data);
            },
            error: function(error) {
                console.log("ERR: " + data);
                reject(error);
            }
        });
    });
}

const deleteData = (path, ts_id) => {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: path,
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: { ts_id: ts_id },
            success: function(data) {
                console.log("OK: " + data);
                resolve(data);
            },
            error: function(error) {
                console.log("ERR: " + error);
                reject(error);
            }
        });
    });
};


const updateTimesheet = async (dataItems) => {

    try {
        const response = await updateData(config.updateTimesheetsPhp, dataItems);
        console.log(response);
        alert(response);
      
    } catch (error) {
        console.error('Error fetching:', error);
    }
   
}

const deleteTimesheet = async (dataItems) => {

    try {
        const response = await deleteData(config.deleteTimesheetsItemsPhp, dataItems.ts_id);
        console.log(response);
      
    } catch (error) {
        console.error('Error fetching:', error);
    }
   
}

const addEmployee = () => {
    // Collect form data
    let employeeName = $("#addEmpName").val();
    let overtimeEligible = $("#addOvertime").val();
    let startDate = $("#addEmpStart").val();
    let endDate = $("#addEmpEnd").val();

    // Prepare data object
    let formData = {
        emp_name: employeeName,
        overtime: overtimeEligible,
        emp_start: startDate,
        emp_end: endDate
    };

    // Perform AJAX request
    saveData(config.addEmployeesPhp, formData)
        .then((data) => {
            alert(data.message);
            $('#employeeTab').tab('show');
            employee_data.read();
            $('#employeeTableBody').data('kendoGrid').refresh();
        })
        .catch((error) => {
            console.error('Error fetching:', error);
        });
}


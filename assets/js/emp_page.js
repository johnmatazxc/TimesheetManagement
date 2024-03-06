// import config
import config from '../../config/config.js';


$(document).ready(function () {
    loadPages();

});

const empId = $('#empData').data('emp-id');

// Load the timesheet html to the container
const loadPages = () => {
    console.log("HERE");
    $('#emp_timesheets').load(config.empTimesheetsHtml, () => {
        displayTimesheets();
        displayAddTimesheets();
        $('#refreshTimesheets').click(function () {
            timesheetsheet_data.read();
            $('#timesheetsTableBody').data('kendoGrid').refresh();
        });
        timesheetEvents();
    });

    // Logout the current user and redirect to login.php
    $("#logoutBtn").on("click", () => {
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

const getData = (path, maxPageSize, data) => {
    return new kendo.data.DataSource({
        transport: {
            read: {
                url: path, // Your server-side PHP file
                dataType: 'json',
                data: data
            }
        },
        pageSize: maxPageSize
    });
};

const timesheetsheet_data = getData(config.fetchTimesheetsPhp, 20, {emp_id: empId});
const displayTimesheets = () => {
    console.log(timesheetsheet_data);
    $('#timesheetsTableBody').kendoGrid({
        dataSource: timesheetsheet_data,
        scrollable: true,
        sortable: true,
        pageable: true,
        columns: [
            { field: "emp_id", title: "Employee ID", editable: false },
            { field: "emp_name", title: "Employee Name" },
            { field: "ts_date", title: "Timesheet Date", format: "{0:d}" },
            { field: "approved", title: "Approved" },
            { field: "modified", title: "Last Modified" },
            {
                command: { text: "View", click: toggleScreens }, title: " ", width: "180px",
            },
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
        console.log("WORK DESC: ");
        dataItem.items = response;
        console.log("Added " + JSON.stringify(dataItem));
    } catch (error) {
        console.error('Error fetching:', error);
    }

    return dataItem;
};

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

const toggleScreens = async (e) => {
    let dataItem = await getDataItem(e);
    console.log("FORM DATA111111: " + dataItem.approved);
    loadViewTimesheet(dataItem);

    // View Timesheet, Work Description
    
    let workDescFields = dataItem.approved === 'N'? generateWorkDescField(parseInt(dataItem.hours, 10), true, false) : generateWorkDescField(parseInt(dataItem.hours, 10), true, true);
    let formData = generateTimeSlotsFromDB(parseInt(dataItem.hours, 10), dataItem.start_time, dataItem);
    console.log("FORM DATA: " + JSON.stringify(formData));
    addItemsToWorkDescription(workDescFields, "#viewTimesheetBodyWorkDesc", formData);
    $("input[readonly]").addClass("readonly-field");

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

const loadViewTimesheet = (dataItem) => {
    $("#viewTimesheetBody").kendoGrid({
        dataSource: {
            data: dataItem,
            schema: {
                model: {
                    fields: {
                        emp_name: { type: "string" },
                        ts_date: { type: "Date" },
                        start_time: { type: "string" },
                        end_time: { type: "string" }
                    }
                }
            },
            pageSize: 20
        },
        scrollable: true,
        columns: [
            { field: "emp_name", title: "Employee Name", width: "130px" },
            { field: "ts_date", title: "Timesheet Date", format: "{0:yyyy-MM-dd}", width: "130px", },
            { field: "start_time", title: "Shift Start", width: "130px" },
            { field: "end_time", title: "Shift End", width: "130px" }
        ]
    });


    $('#backButton').on("click", () => {
        $('#viewTimesheetBody').data("kendoGrid").destroy();
        $('#viewTimesheetBody').empty();

        $('#viewTimesheetScreen').hide();
        $('#timesheetScreen').show();
    });
}

const timesheetEvents = () => {
    $("#addTimesheetModalBtn").on("click", function () {
        // $('#addTimesheetForm').getKendoForm().clear();
        $("#addTimesheetModal").modal("show");
    });

    $("#closeTimesheetModalBtn").on("click", function () {
        $("#addTimesheetModal").modal("hide");
    });

    $("#saveTimesheet").on("click", function () {
        console.log("SAVE");
        let validatorInfo = $('#addTimesheetForm').kendoValidator().data("kendoValidator");
        let validatorTimeDesc = $('#addTimesheetFormStatic').kendoValidator().data("kendoValidator");

        if (validatorInfo.validate() && validatorTimeDesc.validate()) {
            // Get the inputs value
            let dataFromAddTimesheetGroup = $("#addTimesheetForm").serializeArray();
            let dataFromWorkDescriptionj = $('#addTimesheetFormStatic').serializeArray();
            console.log(dataFromWorkDescriptionj);

            const savedData = transformAddTimesheetGroupData(dataFromAddTimesheetGroup);
            const workDesc = transformWorkDescriptionData(dataFromWorkDescriptionj);
            $.each(workDesc, function (index, item) {
                item.time_from = removeAmPm(item.time_from);
                item.time_out = removeAmPm(item.time_out);
            });

            // Add Work Description Data to the group
            savedData['emp_id'] = empId;
            savedData['work_desc'] = JSON.stringify(workDesc);

            // Add hours, minutes and overtime field to the savedData
            let timeDiff = calculateTimeDiff(savedData.start_time, savedData.end_time);
            savedData.hours = timeDiff.hours;
            savedData.minutes = timeDiff.minutes;
            savedData.overtime = timeDiff.hours > 8 ? 'Y' : 'N';

            savedData.start_time = removeAmPm(savedData.start_time);
            savedData.end_time = removeAmPm(savedData.end_time);

            console.log(savedData);

            // $.ajax({
            //     type: "POST",
            //     url: config.saveTimesheetsPhp,
            //     data: savedData
            // }).then(function (response) {
            //     console.log("Success: " + response);
            //     // Handle success - you can replace this with any success message or action
            // }).catch(function (error) {
            //     console.log("Error: " + error.statusText);
            //     // Handle error - you can replace this with any error message or action
            // });

        } else {
            // Handle validation errors
            console.log("Validation failed.");
        }

        $('#addTimesheetForm').getKendoForm().clear();
        $('#addTimesheetFormStatic').getKendoForm().destroy();
        $('#addTimesheetFormStatic').empty();

        $("#addTimesheetModal").modal("hide");

    });

    $('#addTimesheetModal').on('hidden.bs.modal', function () {

    });
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
    var time = timeString.match(/(\d+):(\d+) (\w+)/);
    var hours = parseInt(time[1]);
    var minutes = parseInt(time[2]);
    var meridian = time[3];

    // Convert to 24-hour format
    if (hours < 12 && meridian === 'PM') {
        hours += 12;
    } else if (hours === 12 && meridian === 'AM') {
        hours = 0;
    }

    return new Date('1970-01-01 ' + hours + ':' + minutes);
}

const removeAmPm = (timeString) => {
    return timeString.replace(' AM', '').replace(' PM', '');
}

const transformAddTimesheetGroupData = (data) => {
    let result = {};
    data.forEach(item => {
        result[item.name] = item.value;
    });


    return result;
};

const transformWorkDescriptionData = (data) => {
    const groupedData = [];
    const groupMap = {};

    data.forEach(item => {
        // Extract the group number from the name (e.g., "from1" -> "1")
        const groupNumber = item.name.replace(/[^\d]/g, '');

        // Initialize the group in the map if it doesn't exist
        if (!groupMap[groupNumber]) {
            groupMap[groupNumber] = {};
        }

        // Determine the key from the name (e.g., "from1" -> "from")
        const key = item.name.replace(groupNumber, '');

        // Assign the value to the correct key in the group
        groupMap[groupNumber][key] = item.value;
    });

    // Convert the map to an array
    for (let group in groupMap) {
        groupedData.push(groupMap[group]);
    }

    return groupedData;
}

const generateFormData = (from, to) => {
    return {
        from: new Date(from),
        to: new Date(to),
        format: "hh:mm"
    };
}

const timeEditor = (container, options, id) => {
    // Create a timepicker element
    let timepicker = $("<input required name='" + options.field + "' id='" + id + "' />").appendTo(container).kendoTimePicker({
        format: "HH:mm", // Time format
        value: options.model[options.field]
    }).data("kendoTimePicker");


    timepicker.bind("change", function () {
        let timeDifference = calculateTimeDifference();

        if (timeDifference > 0) {
            let workDescFields = generateWorkDescField(timeDifference, false);
            let timeSlots = generateTimeSlots(timeDifference, $('#addTimesheetForm').find("#start_time").val());
            addItemsToWorkDescription(workDescFields, "#addTimesheetFormStatic", timeSlots);

            console.log("CHAM: ");
        }

    });
}

const addTimesheetConfig = {
    orientation: "vertical",
    items: [
        {
            type: "group",
            label: "Add Timesheet",
            layout: "grid",
            grid: { cols: 2, gutter: 10 },
            items: [
                { field: "emp_name", label: "Employee Name:", validation: { required: true }, colSpan: 1 },
                { field: "ts_date", label: "Timesheet Date:", editor: "DatePicker", validation: { required: true }, colSpan: 1 },
                {
                    field: "start_time", label: "Shift Start: ", validation: { required: true }, colSpan: 1,
                    editor: function (container, options) {
                        timeEditor(container, options, "start_time");
                    }
                },
                {
                    field: "end_time", label: "Shift End : ",
                    editor: function (container, options) {
                        timeEditor(container, options, "end_time");
                    },
                    validation: { required: true }, colSpan: 1
                },
            ],
        }
    ],
};

const workDescConfig = {
    orientation: "vertical",
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

// Initialize the kendo form for the first time
const displayAddTimesheets = () => {
    console.log(addTimesheetConfig.formData);
    $('#addTimesheetForm').kendoForm(addTimesheetConfig);
    $('#addTimesheetFormStatic').kendoForm(workDescConfig);

    // Hide the save and clear button for the kendo ui
    $('.k-form-clear, .k-form-submit').hide();
    $('.k-form-clear, .k-form-submit').css('display', 'none');

}

const calculateTimeDifference = () => {
    let startTime = $("#start_time").data("kendoTimePicker").value();
    let endTime = $("#end_time").data("kendoTimePicker").value();

    if (startTime && endTime) {
        // Convert times to milliseconds and calculate the difference
        let differenceInMilliseconds = endTime.getTime() - startTime.getTime();

        // Convert milliseconds to hours (1 hour = 3600000 milliseconds)
        let differenceInHours = differenceInMilliseconds / 3600000;

        // Round to nearest whole number
        return Math.round(differenceInHours);
    } else {
        // Return 0 or handle invalid time inputs appropriately
        return 0;
    }
};

// Generate the work descripton field
const generateWorkDescField = (iterations, isTimeReadOnly, isDescReadOnly) => {
    var fields = [];

    for (var i = 1; i <= iterations; i++) {
        fields.push(
            { field: "time_from" + i, label: "From : ", editor: "TextBox", editorOptions: { readonly: isTimeReadOnly }, colSpan: 1 },
            { field: "time_out" + i, label: "To : ", editor: "TextBox", editorOptions: { readonly: isTimeReadOnly }, colSpan: 1 },
            { field: "description" + i, label: "Description : ", editor: "TextBox", editorOptions: { readonly: isDescReadOnly }, validation: { required: true }, colSpan: 3 }
        );
    }

    return fields;
}

const generateTimeSlots = (iterations, startTimeStr, dataItem) => {
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

const generateTimeSlotsFromDB = (iterations, startTimeStr, dataItem) => {
    console.log("DATA ITEM BEFORE ", dataItem.items);
    console.log("DATA ITEM BEFORE ", JSON.stringify(dataItem));

    let timeSlots = {};
    let currentTime = convertStringToDate(startTimeStr);

    for (let i = 1; i <= iterations; i++) {
        let formattedTimeFrom = formatTime(currentTime);
        let timeFrom = formatTime1(currentTime);
        let timeFromKey = 'time_from' + i;

        // Calculate 'to' time (one hour ahead)
        currentTime = new Date(currentTime.getTime() + 60 * 60000); // Add 1 hour
        let formattedTimeTo = formatTime(currentTime);
        let timeTo = formatTime1(currentTime);
        let timeToKey = 'time_out' + i;

        // Check if time_from and time_out match with any item in dataItem.items
        console.log("Time From " +timeFrom + "  || Time To " +timeTo);
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
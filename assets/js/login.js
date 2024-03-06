// import config
import config from '../../config/config.js';


$(document).ready(function () {
    toggleContainer();
    events();
    
});

const toggleContainer = () => {
    const container = $('#container');
    const registerBtn = $('#register');
    const signInBtn = $('#signIn');

    registerBtn.on('click', () => {
        container.addClass("active");
    });



    signInBtn.on('click', () => {
        container.removeClass("active");
    });
}

const events = () => {
    $('#togglePassword').on('click', () => {
        const passwordInput = $('#password');
        const icon = $('#togglePassword');

        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            passwordInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    
}


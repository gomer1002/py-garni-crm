"use strict";

const dbg = false;

const loginForm = document.querySelector("#loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", validateLogin);
}

const registerForm = document.querySelector("#registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", validateRegister);
}

const registerPassword = document.querySelector("#registerPassword");
if (registerPassword) {
    registerPassword.oninput = function (event) {
        registerRepeatPassword.setAttribute("pattern", event.target.value);
    };
}

const registerRepeatPassword = document.querySelector(
    "#registerRepeatPassword"
);
if (registerRepeatPassword) {
    registerRepeatPassword.oninput = function (event) {
        if (event.target.validity.patternMismatch) {
            event.target.setCustomValidity("Пароли должны совпадать");
        } else {
            event.target.setCustomValidity("");
        }
    };
}

function validateLogin(evt) {
    evt.preventDefault();
    let phone = loginForm.loginPhone.value.replace(/\D/g, "");
    if (["7", "8"].indexOf(phone[0]) > -1) {
        phone =
            "7" + loginForm.loginPhone.value.replace(/\D/g, "").substring(1);
    }
    let password = loginForm.loginPassword.value;
    let enc_password = md5(password);

    if (dbg) {
        console.log("Form data:", phone, password);
        console.log("Sended data:", phone, enc_password);
    }

    auth_me(phone, enc_password);
}

function validateRegister(evt) {
    evt.preventDefault();

    let name = registerForm.registerName.value;
    let phone =
        "7" + registerForm.registerPhone.value.replace(/\D/g, "").substring(1);
    let password = registerForm.registerPassword.value;
    let enc_password = md5(password);

    if (dbg) {
        console.log("Form data:", name, phone, password);
        console.log("Sended data:", name, phone, enc_password);
    }

    register_me(name, phone, enc_password);
}

function auth_me(phone, password) {
    toggleSubmitSpinner(loginForm);

    let auth_data = { phone: phone, password: password };

    axios
        .post("/api/auth/login", auth_data)
        .then(function (response) {
            toggleSubmitSpinner(loginForm);
            showAlert({ message: response.data.message, type: "success" });

            window.location.href = loginForm.dataset.redirectTarget;
        })
        .catch(function (error) {
            toggleSubmitSpinner(loginForm);
            showAlert({ message: error.response.data.message, type: "danger" });
        });
}

function register_me(name, phone, password) {
    toggleSubmitSpinner(registerForm);

    let register_data = { name: name, phone: phone, password: password };

    axios
        .post("/api/auth/register", register_data)
        .then(function (response) {
            toggleSubmitSpinner(registerForm);

            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });

                window.location.href = registerForm.dataset.redirectTarget;
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            toggleSubmitSpinner(registerForm);
            showAlert({ message: error.response.data.message, type: "danger" });
        });
}

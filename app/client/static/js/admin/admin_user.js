"use strict";

let logged_user_id;

const registerPassword = document.querySelector("#registerPassword");
if (registerPassword) {
    registerPassword.oninput = function (event) {
        registerRepeatPassword.setAttribute("pattern", event.target.value);
        if (event.target.validity.tooShort) {
            event.target.setCustomValidity(
                "Пароль должен быть минимум " +
                    event.target.minLength +
                    " символов."
            );
        } else if (event.target.validity.patternMismatch) {
            event.target.setCustomValidity(
                "Пароль может содерать только буквы, цифры, а также тире и символ подчеркивания."
            );
        } else {
            event.target.setCustomValidity("");
        }
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

function toggleSpinner(elem) {
    let edit_controls = elem.querySelector(".edit-controls");
    let btns = edit_controls.querySelectorAll("button");
    btns[0].disabled = !btns[0].disabled;
    btns[1].disabled = !btns[1].disabled;
    let data = {
        true: `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`,
        false: `<i class="far fa-lg fa-save text-dark"></i>`,
    };
    btns[1].innerHTML = data[btns[1].disabled];
}

function toggleUserForm(form) {
    let name_container = form.querySelector(".name-container");
    let name_text = name_container.querySelector(".text");
    let name_input = name_container.querySelector(".input");
    name_text.innerText = name_text.innerText;
    name_input.children[0].value = name_text.innerText;
    switchVisibility(name_text, name_input);

    let phone_container = form.querySelector(".phone-container");
    let phone_text = phone_container.querySelector(".text");
    let phone_input = phone_container.querySelector(".input");
    phone_text.innerText = phone_text.innerText.replace(/\D/g, "");
    phone_input.children[0].value = phone_text.innerText;
    formatPhone(phone_input.children[0]);
    switchVisibility(phone_text, phone_input);

    let user_k = form.user_k.value;
    let user_rights = usersData[user_k].rights;
    let right_container = form.querySelector(".right-container");
    let ch_boxs = right_container.querySelectorAll("input");
    for (let i = 0; i < ch_boxs.length; i++) {
        ch_boxs[i].disabled = !ch_boxs[i].disabled;
        ch_boxs[i].checked = user_rights.indexOf(ch_boxs[i].value) != -1;
    }
}

/* spacer */
function saveUserChanges(elem) {
    let form = elem.closest("form");
    let name = form.user_name.value;
    let user_id = form.user_id.value;
    let phone = form.user_phone.value.replace(/\D/g, "");
    let rights = [];

    if (name.trim() == "") {
        showAlert({
            message: "Необходимо ввести имя пользователя!",
            type: "danger",
        });
        return;
    }

    if (phone.length != 11) {
        showAlert({
            message:
                "Введенный номер не соответствует формату +7 (___) ___-__-__!",
            type: "danger",
        });
        return;
    }

    let right_container = form.querySelector(".right-container");
    let ch_boxs = right_container.querySelectorAll("input");
    for (let i = 0; i < ch_boxs.length; i++) {
        if (ch_boxs[i].checked) {
            rights.push(ch_boxs[i].value);
        }
    }

    let user_data = {
        name: name,
        phone: phone,
        user_id: user_id,
        rights: rights,
    };
    toggleSpinner(form);
    axios
        .post("/api/user/update", user_data)
        .then(function (response) {
            toggleSpinner(form);
            // console.log("then ", response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                updateUsersList();
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            toggleSpinner(form);
            showAlert({ message: error.response.data.message, type: "danger" });
            // print(error);
            // console.log("catch ", error.response.data);
        });
}
/* spacer */

let usersData = {};
let rightsData = {};

function renderUsersList() {
    let getUsersListHeader = () => {
        return `
        <form class="list-group-item user-item p-2">
            <span
                class="col-3 dropdown"
                ${sortSettings({
                    by: "sortName",
                    sel: "data-sort-name",
                })}
            >
                <i
                    class="far fa-lg fa-closed-captioning"
                    ${dropdownControls}
                ></i>
                ${sortControls}
                <span class="dropdown-menu p-2">Имя пользователя</span>
            </span>

            <span
                class="col-3 dropdown"
                ${sortSettings({
                    by: "sortPhone",
                    sel: "data-sort-phone",
                })}
            >
                <i
                    class="fas fa-lg fa-mobile-alt"
                    ${dropdownControls}
                ></i>
                ${sortControls}
                <span class="dropdown-menu p-2">Телефон пользователя</span>
            </span>

            <span
                class="col-2 dropdown"
                ${sortSettings({
                    by: "sortUpdateDate",
                    sel: "data-sort-update-date",
                    num: true,
                    swap: true,
                })}
            >
                <i
                    class="far fa-calendar"
                    ${dropdownControls}
                ></i>
                ${sortControls}
                <span class="dropdown-menu p-2"
                    >Дата регистарции</span
                >
            </span>

            <span class="col-1 dropdown">
                <i
                    class="fas fa-lg fa-universal-access"
                    ${dropdownControls}
                ></i>
                <span class="dropdown-menu p-2"
                    >Права доступа</span
                >
            </span>
            
            <div class="col-2">
                <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" data-mdb-toggle="modal" data-mdb-target="#newUserModal">
                    <i class="fas fa-lg fa-user-plus text-dark"></i>
                </button>
                <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" onclick="updateUsersList()">
                    <i class="fas fa-lg fa-redo text-dark"></i>
                </button>
            </div>
        </form>
        `;
    };
    let getUserRecord = (user_data) => {
        let getRightsList = (user_id, user_rights) => {
            let getRightBody = (right, option, user_id) => {
                return `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="right_${user_id}_${right}" value="${right}" name="${right}" disabled ${
                    option ? "checked" : ""
                } />
                    <label class="form-check-label" for="right_${user_id}_${right}">${right}</label>
                </div>
                `;
            };
            let ans_list = ``;
            for (let right of rightsData) {
                let opt = user_rights.indexOf(right) != -1;
                ans_list += getRightBody(right, opt, user_id);
            }
            return ans_list;
        };

        let getRecordBody = (user_data) => {
            let date = new Date(user_data.registered_on_unix * 1000);
            return `
            <!-- User id -->
            <input type="hidden" name="user_id" value="${user_data.user_id}">
            <!-- User k -->
            <input type="hidden" name="user_k" value="${user_data.k}">

            <!-- User name -->
            <div class="col-3 name-container">
                <div class="text">
                    ${user_data.name}
                </div>
                <div class="input display-none">
                    <input type="text" name="user_name" class="form-control" placeholder="Имя пользователя" required>
                </div>
            </div>

            <!-- User phone -->
            <div class="col-3 phone-container">
                <div class="text">
                    ${user_data.phone}
                </div>
                <div class="input display-none">
                    <input 
                        type="tel" 
                        name="user_phone" 
                        data-tel-input 
                        class="form-control" 
                        placeholder="+7 (___) ___-__-__" 
                        pattern="(\\+7|8) \\((\\d){3}\\) (\\d){3}(-(\\d){2}){2}" 
                        minlength="11" 
                        maxlength="18" 
                        required 
                    />
                </div>
            </div>

            <!-- User register date -->
            <div class="col-2 date-container">
                <div class="text">
                    ${date.toLocaleDateString("ru-RU")}
                </div>
                <div class="input display-none">
                </div>
            </div>

            <!-- User rights -->
            <div class="col-1 right-container">
                <div class="dropdown">
                    <a
                        href="#"
                        class="text-dark dropdown-toggle"
                        type="button"
                        data-mdb-toggle="dropdown"
                        aria-expanded="false"
                        data-mdb-auto-close="outside"
                        ><i class="fas fa-list-ul tag-dropdown-toggle"></i
                    ></a>
                    <div class="dropdown-menu p-2" style="width: 250px">
                        ${getRightsList(user_data.user_id, user_data.rights)}
                    </div>
                </div>
            </div>

            <!-- User controls -->
            <div class="col-2 controls-container">
                ${
                    logged_user_id == user_data.user_id
                        ? ""
                        : `
                    <div class="base-controls">
                        <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" onclick="toggleControls(this, toggleUserForm)">
                            <i class="fas fa-lg fa-user-edit text-dark"></i>
                        </button>
                    </div>
                    <div class="edit-controls display-none">
                        <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" onclick="toggleControls(this, toggleUserForm)">
                            <i class="fas fa-lg fa-times text-dark"></i>
                        </button>
                        <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" onclick="saveUserChanges(this)">
                            <i class="far fa-lg fa-save text-dark"></i>
                        </button>
                    </div>
                `
                }
            </div>
        `;
        };

        let form = document.createElement("form");
        form.classList = ["list-group-item user-item p-2"];
        form.id = `user_${user_data.user_id}`;
        form.name = `user_${user_data.user_id}`;
        form.dataset.sortName = user_data.name;
        form.dataset.sortPhone = user_data.phone;
        form.dataset.sortRegisterDate = user_data.registered_on_unix;
        form.innerHTML = getRecordBody(user_data);
        return form;
    };

    let usersList = document.querySelector("#usersList");
    usersList.innerHTML = getUsersListHeader();
    for (let k of Object.keys(usersData)) {
        usersData[k].k = k;
        let userRecord = getUserRecord(usersData[k]);
        usersList.appendChild(userRecord);
    }
}

const newUserForm = document.querySelector("#newUserForm");

if (newUserForm) {
    newUserForm.addEventListener("submit", createNewUser);
}

const newUserPassword = document.querySelector("#newUserPassword");
if (newUserPassword) {
    newUserPassword.oninput = function (event) {
        newUserRepeatPassword.setAttribute("pattern", event.target.value);
        if (event.target.validity.tooShort) {
            event.target.setCustomValidity(
                "Пароль должен быть минимум " +
                    event.target.minLength +
                    " символов."
            );
        } else if (event.target.validity.patternMismatch) {
            event.target.setCustomValidity(
                "Пароль может содерать только буквы, цифры, а также тире и символ подчеркивания."
            );
        } else {
            event.target.setCustomValidity("");
        }
    };
}

const newUserRepeatPassword = document.querySelector("#newUserRepeatPassword");
if (newUserRepeatPassword) {
    newUserRepeatPassword.oninput = function (event) {
        if (event.target.validity.patternMismatch) {
            event.target.setCustomValidity("Пароли должны совпадать");
        } else {
            event.target.setCustomValidity("");
        }
    };
}

function createNewUser(evt) {
    evt.preventDefault();
    let name = newUserForm.user_name.value;
    let phone = newUserForm.user_phone.value.replace(/\D/g, "");
    let password = md5(newUserForm.user_password.value);

    let new_user_data = { name: name, phone: phone, password: password };

    toggleSubmitSpinner(newUserForm);

    axios
        .post("/api/user/set", new_user_data)
        .then(function (response) {
            // console.log("then ", response.data);
            toggleSubmitSpinner(newUserForm);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                newUserForm.reset();
                hideModal("#newUserModal");
                updateUsersList();
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            // console.log("catch ", error.response.data);
            toggleSubmitSpinner(newUserForm);
            showAlert({ message: error.response.data.message, type: "danger" });
        });
}

function confirmDeletion(elem) {
    let user_id = elem.closest("form").user_id.value;
    document.querySelector("#confirmModal").dataset["user_id"] = user_id;
}

function deleteUser() {
    let user_id = document.querySelector("#confirmModal").dataset["user_id"];
    let delete_data = { user_id: user_id };
    axios
        .post("/api/user/del", delete_data)
        .then(function (response) {
            // console.log("then ", response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                hideModal("#confirmModal");
                updateUsersList();
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            showAlert({ message: error.response.data.message, type: "danger" });
            // console.log("catch ", error.response.data);
        });
}

function updateUsersList() {
    const promise1 = new Promise((resolve, reject) => {
        resolve(getDataFrom("/api/user/get"));
    })
        .then((data) => {
            usersData = sortObject(data, user_obj_comparator, "user_id");
            return getDataFrom("/api/user/rights");
        })
        .then((data) => {
            rightsData = data.sort();
            renderUsersList();
            initPhoneInput();
        })
        .catch((reason) => {
            console.log(reason);
        });
}

function initPage() {
    updateUsersList();
    setUpAutoLogOut("/admin");
    logged_user_id = parseJwt(getCookie("access_token_cookie")).sub;
    window.addEventListener("scroll", function () {
        if (window.scrollY > 0) {
            addClass(this.document.querySelector(".header_area"), "sticky");
            if (window.scrollY > 150) {
                renderScrollArrow();
            }
        } else {
            removeClass(this.document.querySelector(".header_area"), "sticky");
            renderScrollArrow(true);
        }
    });
}

document.addEventListener("DOMContentLoaded", initPage);

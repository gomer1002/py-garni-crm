"use strict";

let logged_user_id;

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
            showAlert({ message: error.response.message, type: "danger" });
            // console.log("catch ", error.response.data);
        });
}
/* spacer */

let usersData = {};
let rightsData = {};

function renderUsersList() {
    let getUsersListHeader = () => {
        return `
        <div class="list-group-item list-item d-flex justify-content-around text-center p-2">

            <span
                class="s-item d-flex flex-row justify-content-center align-items-center text-center dropdown"
                onclick="sortData(this)"
                data-sort-by="sortName"
                data-sort-selector="data-sort-name"
                data-sort-direction="1"
            >
                <i
                    class="far fa-lg fa-closed-captioning"
                    data-mdb-toggle="dropdown"
                    aria-expanded="false"
                    style="cursor: pointer"
                    onmouseenter="new mdb.Dropdown(this).show()"
                    onmouseleave="new mdb.Dropdown(this).hide()"
                ></i>
                <div class="sort-controls ps-1">
                    <i class="fas fa-caret-right sort-no"></i>
                    <i class="fas fa-caret-down sort-down display-none"></i>
                    <i class="fas fa-caret-up sort-up display-none"></i>
                </div>
                <span class="dropdown-menu p-2">Имя пользователя</span>
            </span>

            <span
                class="m-item d-flex flex-row justify-content-center align-items-center text-center dropdown"
                onclick="sortData(this)"
                data-sort-by="sortPhone"
                data-sort-selector="data-sort-phone"
                data-sort-direction="1"
            >
                <i
                    class="fas fa-lg fa-mobile-alt"
                    data-mdb-toggle="dropdown"
                    aria-expanded="false"
                    style="cursor: pointer"
                    onmouseenter="new mdb.Dropdown(this).show()"
                    onmouseleave="new mdb.Dropdown(this).hide()"
                ></i>
                <div class="sort-controls ps-1">
                    <i class="fas fa-caret-right sort-no"></i>
                    <i class="fas fa-caret-down sort-down display-none"></i>
                    <i class="fas fa-caret-up sort-up display-none"></i>
                </div>
                <span class="dropdown-menu p-2">Телефон пользователя</span>
            </span>

            <span
                class="sm-item d-flex flex-row justify-content-center align-items-center text-center dropdown"
                onclick="sortData(this)"
                data-sort-by="sortUpdateDate"
                data-sort-selector="data-sort-update-date"
                data-sort-direction="1"
                data-sort-number="true"
                data-sort-swap="true"
            >
                <i
                    class="far fa-calendar"
                    data-mdb-toggle="dropdown"
                    aria-expanded="false"
                    style="cursor: pointer"
                    onmouseenter="new mdb.Dropdown(this).show()"
                    onmouseleave="new mdb.Dropdown(this).hide()"
                ></i>
                <div class="sort-controls ps-1">
                    <i class="fas fa-caret-right sort-no"></i>
                    <i class="fas fa-caret-down sort-down display-none"></i>
                    <i class="fas fa-caret-up sort-up display-none"></i>
                </div>
                <span class="dropdown-menu p-2"
                    >Дата регистарции</span
                >
            </span>

            <span class="m-item dropdown">
                <i
                    class="fas fa-lg fa-universal-access"
                    data-mdb-toggle="dropdown"
                    aria-expanded="false"
                    style="cursor: pointer"
                    onmouseenter="new mdb.Dropdown(this).show()"
                    onmouseleave="new mdb.Dropdown(this).hide()"
                ></i>
                <span class="dropdown-menu p-2"
                    >Права доступа</span
                >
            </span>
            
            <div class="s-item">
                <button type="submit" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" data-mdb-toggle="modal" data-mdb-target="#newUserModal">
                    <i class="fas fa-lg fa-user-plus text-dark"></i>
                </button>
                <button type="submit" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" onclick="updateUsersList()">
                    <i class="fas fa-lg fa-redo text-dark"></i>
                </button>
            </div>
        </div>
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
            <div class="s-item name-container">
                <div class="text">
                    ${user_data.name}
                </div>
                <div class="input display-none">
                    <input type="text" name="user_name" class="form-control" placeholder="Имя пользователя" required>
                </div>
            </div>

            <!-- User phone -->
            <div class="m-item phone-container">
                <div class="text">
                    ${user_data.phone}
                </div>
                <div class="input display-none">
                    <input type="tel" name="user_phone" data-tel-input class="form-control" placeholder="+7 (___) ___-__-__" required />
                </div>
            </div>

            <!-- User register date -->
            <div class="sm-item date-container">
                <div class="text">
                    ${date.toLocaleDateString("ru-RU")}
                </div>
                <div class="input display-none">
                </div>
            </div>

            <!-- User rights -->
            <div class="m-item right-container">
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
                    <div class="dropdown-menu p-2" style="width: 200px">
                        ${getRightsList(user_data.user_id, user_data.rights)}
                    </div>
                </div>
            </div>

            <!-- User controls -->
            <div class="s-item controls-container">
                ${
                    logged_user_id == user_data.user_id
                        ? ""
                        : `
                    <div class="base-controls">
                        <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" onclick="toggleControls(this, toggleUserForm)">
                            <i class="fas fa-lg fa-user-edit text-dark"></i>
                        </button>
                        <button type="button" class="btn btn-link btn-sm px-3 " data-ripple-color="dark" data-mdb-toggle="modal" data-mdb-target="#confirmModal" onclick="confirmDeletion(this)">
                            <i class="fas fa-lg fa-user-times text-dark"></i>
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
        form.classList = [
            "list-group-item list-item d-flex justify-content-around text-center p-2",
        ];
        form.id = `user_${user_data.user_id}`;
        form.name = `user_${user_data.user_id}`;
        form.dataset.sortName = user_data.name;
        form.dataset.sortPhone = user_data.phone;
        form.dataset.sortRegisterDate = user_data.registered_on_unix;
        form.innerHTML = getRecordBody(user_data);
        return form;
    };

    let usersListContainer = document.querySelector("#usersListContainer");
    let usersList = usersListContainer.querySelector("ul");
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
            usersData = data;
            return getDataFrom("/api/user/rights");
        })
        .then((data) => {
            rightsData = data;
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
}

document.addEventListener("DOMContentLoaded", initPage);

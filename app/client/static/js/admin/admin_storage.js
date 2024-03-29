"use strict";
let storageData;
let tagsData;

let incomeForm = document.querySelector("#incomeForm");
incomeForm.addEventListener("submit", saveIncomeChanges);

let outcomeForm = document.querySelector("#outcomeForm");
outcomeForm.addEventListener("submit", saveIncomeChanges);

function swapData(container) {
    let from_elem = container.querySelector(".text");
    let to_elem = container.querySelector(".input");
    from_elem.innerText = from_elem.innerText.replace(/\n/g, "");
    to_elem.children[0].value = from_elem.innerText;
    switchVisibility(from_elem, to_elem);
}

function toggleStorageForm(form) {
    let name_container = form.querySelector(".name-container");
    swapData(name_container);

    // let amount_container = form.querySelector(".amount-container");
    // swapData(amount_container);

    let min_amount_container = form.querySelector(".min-amount-container");
    swapData(min_amount_container);

    let unit_container = form.querySelector(".unit-container");
    swapData(unit_container);

    let ingredient_id = form.ingredient_id.value;
    let item_tags = storageData[ingredient_id].tags;
    let tags_container = form.querySelector(".tags-container");
    let new_state = !tags_container.querySelector("input").disabled;
    tags_container.innerHTML = getTagsContainerInnerHTML(item_tags, new_state);
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

/* spacer */
function saveStorageChanges(elem) {
    let form = elem.closest("form");
    let ingredient_id = form.ingredient_id.value;
    let ingredient_name = form.ingredient_name.value;
    // let amount = form.amount.value;
    let min_amount = form.min_amount.value;
    let unit = form.unit.value;
    let tags = [];

    if (ingredient_name.trim() == "") {
        showAlert({
            message: "Необходимо ввести наименование!",
            type: "danger",
        });
        return;
    }
    if (min_amount.trim() == "") {
        showAlert({
            message: "Необходимо ввести минимальный остаток!",
            type: "danger",
        });
        return;
    }
    if (parseInt(min_amount) < 0) {
        showAlert({
            message: "Минимальный остаток должен быть больше нуля!",
            type: "danger",
        });
        return;
    }
    if (unit.trim() == "") {
        showAlert({
            message: "Необходимо ввести единицы измерения!",
            type: "danger",
        });
        return;
    }
    let tags_container = form.querySelector(".tags-container");
    let inputs = tags_container.querySelectorAll("input");
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].value != "") {
            tags.push(inputs[i].value);
        }
    }

    let data = {
        ingredient_id: ingredient_id,
        ingredient_name: ingredient_name,
        min_amount: min_amount,
        unit: unit,
        tags: tags,
    };
    let path = "/api/storage/update";
    toggleSpinner(form);

    axios
        .post(path, data)
        .then(function (response) {
            toggleSpinner(form);
            // console.log("then ", response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                updateStorageList();
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            showAlert({ message: error.response.data.message, type: "danger" });
            // console.log("catch ", error.response.data);
        });
}
/* spacer */

function getTagsList() {
    let tags = [];
    for (let k of Object.keys(storageData)) {
        let instance = storageData[k];
        if (instance.tags) {
            for (let tag of instance.tags) {
                if (tags.indexOf(tag) == -1) {
                    tags.push(tag);
                }
            }
        }
    }
    return tags.sort();
}

function getTagsContainerInnerHTML(item_tags, disabled = true) {
    let getTagsList = (item_tags) => {
        let getTagsBody = (tag) => {
            return `
            <div class="tag-outline">
                <input class="form-control tag-input" type="text" list="tagList" onfocusout="submitTag(this)" name="${tag}" value="${tag}" ${
                disabled ? "disabled" : ""
            }>
                <i class="far fa-lg fa-minus-square tag-trailing" onclick="destroyTag(this)"></i>
            </div>
            `;
        };

        let ans_list = ``;
        if (item_tags) {
            for (let tag of tagsData) {
                if (item_tags.indexOf(tag) != -1) {
                    ans_list += getTagsBody(tag);
                }
            }
        }
        return ans_list;
    };
    return `
    <div class="dropdown">
        <a
            href="#"
            class="text-dark dropdown-toggle"
            type="button"
            data-mdb-toggle="dropdown"
            aria-expanded="false"
            data-mdb-auto-close="outside"
            ><i class="fas fa-lg fa-list-ul tag-dropdown-toggle"></i
        ></a>
        <div class="dropdown-menu p-2" style="width: 200px">
            ${getTagsList(item_tags)}
            
            <div class="tag-outline">
                <input class="form-control tag-input" list="tagList" type="text" onfocusout="createTag(event)" onkeydown="createTag(event)" ${
                    disabled ? "disabled" : ""
                }>
            </div>
        </div>
    </div>
    `;
}

function renderStorageDatalist() {
    let renderOption = (item_record) => {
        return `<option data-option-id="${item_record.ingredient_id}" value="${item_record.ingredient_name}" data-option-name="${item_record.ingredient_name}"/>`;
    };

    // check if datalist element exists else create new one
    let income_container = document.querySelector("#incomeForm").parentNode;
    let income_list_container =
        income_container.querySelector("#ingredientList");
    if (!income_list_container) {
        income_list_container = document.createElement("datalist");
        income_list_container.id = "ingredientList";
        income_container.appendChild(income_list_container);
    }
    income_list_container.innerHTML = "";

    //filling datalist element
    for (let ingredient_id of Object.keys(storageData)) {
        let option = renderOption(storageData[ingredient_id]);
        income_list_container.innerHTML += option;
    }
}

function renderStorageSelectList() {
    let renderOption = (item_record) => {
        return `<option data-option-id="${item_record.ingredient_id}" value="${item_record.ingredient_name}" data-option-name="${item_record.ingredient_name}">${item_record.ingredient_name}</option>`;
    };

    let option_list = `<option value=""/>`;
    //filling select element
    for (let ingredient_id of Object.keys(storageData)) {
        let option = renderOption(storageData[ingredient_id]);
        option_list += option;
    }
    return option_list;
}

function createRecord(elem) {
    let getIncomeRecord = () => {
        let div = document.createElement("div");
        div.classList = "list-group-item income-item p-2";
        div.innerHTML = `
            <!-- Ingredient input -->
            <div class="col-4 name-container">
                <input class="form-control" list="ingredientList" type="text" name="" oninput="processStorageData(event)" required>
            </div>

            <!-- item amount -->
            <div class="col-2 amount-container">
                0
            </div>

            <!-- Item unit -->
            <div class="col-2 unit-container">
                gramm
            </div>

            <!-- Item income -->
            <div class="col-2 income-container">
                <input type="number" min="1" name="item_income" class="form-control" required />
            </div>

            <!-- Item controls -->
            <div class="col-1 controls-container">
                <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="destroyStorageRecord(this)">
                    <i class="far fa-lg fa-trash-alt text-dark"></i>
                </button>
            </div>`;
        return div;
    };
    let getOutcomeRecord = () => {
        let div = document.createElement("div");
        div.classList = "list-group-item outcome-item p-2";
        div.innerHTML = `
            <!-- Ingredient input -->
            <div class="col-4 name-container">
                <select class="ingredient-select" oninput="processStorageData(event)" required>
                    ${renderStorageSelectList()}
                </select>
            </div>

            <!-- item amount -->
            <div class="col-2 amount-container">
                0
            </div>

            <!-- Item unit -->
            <div class="col-2 unit-container">
                gramm
            </div>

            <!-- Item income -->
            <div class="col-2 income-container">
                <input type="number" min="1" name="item_income" class="form-control" required />
            </div>

            <!-- Item controls -->
            <div class="col-1 controls-container">
                <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="destroyStorageRecord(this)">
                    <i class="far fa-lg fa-trash-alt text-dark"></i>
                </button>
            </div>`;
        return div;
    };
    let form = elem.closest("form");
    let mode = form.dataset.createMode;
    let selector;
    if (mode == "income") {
        selector = ".income-item";
    } else {
        selector = ".outcome-item";
    }
    let name_containers = form.querySelectorAll(".name-container");
    for (let each of name_containers) {
        if (
            (mode == "income" && each.querySelector("input").value == "") ||
            (mode == "outcome" && each.querySelector("select").value == "")
        ) {
            destroyStorageRecord(each);
        }
    }
    if (mode == "income") {
        form.appendChild(getIncomeRecord());
    } else {
        form.appendChild(getOutcomeRecord());
    }
    let submit_btn = form.parentNode.querySelector("[data-submit-button]");
    let records = form.querySelector(selector);
    if (records) {
        switchElem(submit_btn, "on");
    }
}

function processStorageData(event) {
    let elem = event.target;

    let form = elem.closest("form");
    let mode = form.dataset.createMode;
    let selector;
    if (mode == "income") {
        selector = ".income-item";
    } else {
        selector = ".outcome-item";
    }
    let item_record = elem.closest(selector);
    let amount_container = item_record.querySelector(".amount-container");
    let unit_container = item_record.querySelector(".unit-container");

    if (mode == "income") {
        let ingredient_list_elem =
            form.parentNode.querySelector("#ingredientList");
        let ingredient_list = ingredient_list_elem.querySelectorAll("option");
        for (let each of ingredient_list) {
            if (each.dataset.optionName == elem.value) {
                let ingredient_id = each.dataset.optionId;
                elem.dataset.ingredientId = ingredient_id;
                elem.dataset.name = elem.value;
                amount_container.innerHTML = storageData[ingredient_id].amount;
                unit_container.innerHTML = storageData[ingredient_id].unit;
                break;
            } else {
                elem.dataset.ingredientId = "";
                elem.dataset.name = "";
                amount_container.innerHTML = 0;
                unit_container.innerHTML = "gramm";
            }
        }
    } else {
        let ingredient_id = elem.selectedOptions[0].dataset.optionId;
        if (ingredient_id) {
            amount_container.innerHTML = storageData[ingredient_id].amount;
            unit_container.innerHTML = storageData[ingredient_id].unit;
        } else {
            amount_container.innerHTML = 0;
            unit_container.innerHTML = "gramm";
        }
    }
    return;
}

function saveIncomeChanges(event) {
    event.preventDefault();
    let elem = event.target;
    let form = elem.closest("form");
    let mode = form.dataset.createMode;
    let modal;
    let selector;
    if (mode == "income") {
        modal = "#newIncomeModal";
        selector = ".income-item";
    } else {
        modal = "#newOutcomeModal";
        selector = ".outcome-item";
    }

    let records = form.querySelectorAll(selector);
    let income_list = [];
    let new_items_list = [];

    for (let record of records) {
        let name_el;
        let ingredient_id;
        let ingredient_name;
        let direction;

        if (mode == "income") {
            name_el = record
                .querySelector(".name-container")
                .querySelector("input");
            ingredient_id = name_el.dataset.ingredientId;
            ingredient_name = name_el.value;
            direction = "increase";
        } else {
            name_el = record
                .querySelector(".name-container")
                .querySelector("select");
            ingredient_id = name_el.selectedOptions[0].dataset.optionId;
            ingredient_name = name_el.value;
            direction = "decrease";
        }

        let amount = record
            .querySelector(".income-container")
            .querySelector("input").value;

        // TODO либо оставить так, либо менять форму
        let ingredient_min_amount = 1;
        let unit = "gramm";
        let tags = [];

        if (ingredient_id) {
            income_list.push({
                ingredient_id: ingredient_id,
                ingredient_amount: amount,
                direction: direction,
            });
        } else {
            new_items_list.push({
                ingredient_name: ingredient_name,
                ingredient_amount: amount,
                ingredient_min_amount: ingredient_min_amount,
                unit: unit,
                tags: tags,
            });
        }
    }

    let path = "/api/storage/set";
    let data = {
        income_list: income_list,
        new_items_list: new_items_list,
    };
    // console.log(data);
    toggleSubmitSpinner(form);
    axios
        .post(path, data)
        .then(function (response) {
            toggleSubmitSpinner(form);
            // console.log("then ", response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                form.reset();
                hideModal(modal);
                updateStorageList();
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            toggleSubmitSpinner(editMenuItemModalForm);
            showAlert({ message: error.response.data.message, type: "danger" });
            // console.log("catch ", error);
            // console.log("catch ", error.response.data);
        });
}

function renderStorageList() {
    let getStorageListHeader = () => {
        return `
        <form class="list-group-item storage-item p-2">
                <span 
                    class="col-2"
                    ${sortSettings({
                        by: "sortName",
                        sel: "data-sort-name",
                    })}
                >
                    Наименование
                    ${sortControls}
                </span>

                <span 
                    class="col-2"
                    ${sortSettings({
                        by: "sortAmount",
                        sel: "data-sort-amount",
                        num: true,
                    })}
                >
                    Остаток
                    ${sortControls}
                </span>

                <span 
                    class="col-1"
                    ${sortSettings({
                        by: "sortMinAmount",
                        sel: "data-sort-min-amount",
                        num: true,
                    })}
                >
                    Минимум
                    ${sortControls}
                </span>

                <span class="col-1">Единицы</span>

                <span class="col-1 dropdown">
                    <i
                        class="fas fa-lg fa-universal-access"
                        ${dropdownControls}
                    ></i>
                    <span class="dropdown-menu p-2"
                        >Список тэгов</span
                    >
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
                        >Дата обновления</span
                    >
                </span>

                <div class="col-2">
                    <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" data-mdb-toggle="modal" data-mdb-target="#newIncomeModal">
                        <i class="far fa-lg fa-plus-square text-dark"></i>
                    </button>
                    <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" data-mdb-toggle="modal" data-mdb-target="#newOutcomeModal">
                        <i class="far fa-lg fa-minus-square text-dark"></i>
                    </button>
                    <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="updateStorageList()">
                        <i class="fas fa-lg fa-redo text-dark"></i>
                    </button>
                </div>
            </form>
        `;
    };
    let getStorageRecord = (data) => {
        let getRecordBody = (data) => {
            let date = new Date(data.updated_on_unix * 1000);
            return `
            <!-- Item id -->
            <input type="hidden" name="ingredient_id" value="${
                data.ingredient_id
            }">

            <!-- Item name -->
            <div class="col-2 name-container">
                <div class="text">
                    ${data.ingredient_name}
                </div>
                <div class="input display-none">
                    <input type="text" name="ingredient_name" class="form-control" placeholder="Наименование" required>
                </div>
            </div>

            <!-- item amount -->
            <div class="col-2 amount-container">
                <div class="text">
                    ${data.amount}
                </div>
                <div class="input display-none">
                </div>
            </div>

            <!-- item min amount -->
            <div class="col-1 min-amount-container">
                <div class="text">
                    ${data.min_amount}
                </div>
                <div class="input display-none">
                    <input type="number" min="0" name="min_amount" class="form-control" required />
                </div>
            </div>

            <!-- Item unit -->
            <div class="col-1 unit-container">
                <div class="text">
                    ${data.unit}
                </div>
                <div class="input display-none">
                    <input type="text" name="unit" class="form-control" required />
                </div>
            </div>

            <!-- Item tags -->
            <div class="col-1 tags-container">
                ${getTagsContainerInnerHTML(data.tags, true)}
            </div>

            <!-- Item update date -->
            <div class="col-2 date-container">
                <div class="text">
                    ${date.toLocaleDateString("ru-RU")}
                </div>
                <div class="input display-none">
                </div>
            </div>

            <!-- Item controls -->
            <div class="col-2 controls-container">
                <div class="base-controls">
                    <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="toggleControls(this, toggleStorageForm)">
                        <i class="far fa-lg fa-edit text-dark"></i>
                    </button>
                </div>
                <div class="edit-controls display-none">
                    <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="toggleControls(this, toggleStorageForm)">
                        <i class="fas fa-lg fa-times text-dark"></i>
                    </button>
                    <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="saveStorageChanges(this)">
                        <i class="far fa-lg fa-save text-dark"></i>
                    </button>
                </div>
            </div>
        `;
        };

        let form = document.createElement("form");
        form.classList = ["list-group-item storage-item p-2"];
        form.dataset.sortName = data.ingredient_name;
        form.dataset.sortAmount = data.amount;
        form.dataset.sortMinAmount = data.min_amount;
        form.dataset.sortUpdateDate = data.updated_on_unix;
        form.id = `item_${data.ingredient_id}`;
        form.name = `item_${data.ingredient_id}`;
        form.innerHTML = getRecordBody(data);
        return form;
    };

    let storageList = document.querySelector("#storageList");
    storageList.innerHTML = getStorageListHeader();
    for (let k of Object.keys(storageData)) {
        let storageRecord = getStorageRecord(storageData[k]);
        storageList.appendChild(storageRecord);
    }

    let tag_list_elem = document.querySelector("#tagList");
    if (!tag_list_elem) {
        tag_list_elem = document.createElement("datalist");
        tag_list_elem.id = "tagList";
        storageList.appendChild(tag_list_elem);
    }
    tag_list_elem.innerHTML = "";
    for (let tag of tagsData) {
        tag_list_elem.innerHTML += `<option value="${tag}">`;
    }
}

function destroyTag(elem) {
    elem.closest(".tag-outline").remove();
}

function destroyStorageRecord(elem) {
    let form = elem.closest("form");
    if (elem.closest(".income-item")) {
        elem.closest(".income-item").remove();
    } else if (elem.closest(".outcome-item")) {
        elem.closest(".outcome-item").remove();
    } else {
        return;
    }
    let submit_btn = form.parentNode.querySelector("[data-submit-button]");
    // print(submit_btn);
    let records = form.querySelector(".income-item");
    // print(records);
    if (!records) {
        switchElem(submit_btn, "off");
    }
}

function createTag(event) {
    let elem = event.target;
    if (
        ((event.type == "keydown" && event.keyCode == 13) ||
            event.type == "focusout") &&
        elem.value != ""
    ) {
        let container = elem.closest(".dropdown-menu");
        let div = document.createElement("div");
        div.classList = "tag-outline";
        div.innerHTML = `
        <input class="form-control tag-input" list="tagList" type="text" name="${elem.value}" value="${elem.value}" onfocusout="submitTag(this)">
        <i class="far fa-lg fa-minus-square tag-trailing" onclick="destroyTag(this)"></i>
        `;
        container.insertBefore(div, elem.closest(".tag-outline"));
        elem.value = "";
        submitTag(div);
    }
}

function submitTag(elem) {
    if (elem.value == "") {
        return destroyTag(elem);
    }
    let container = elem.closest(".dropdown-menu");
    let tags_list = [];
    for (let input of container.querySelectorAll("input")) {
        if (tags_list.indexOf(input.value) == -1) {
            tags_list.push(input.value);
            input.name = input.value;
        } else {
            destroyTag(input);
        }
    }
}

function updateStorageList() {
    const promise1 = new Promise((resolve, reject) => {
        resolve(getDataFrom("/api/storage/get"));
    })
        .then((data) => {
            storageData = sortObject(
                data,
                storage_obj_comparator,
                "ingredient_id"
            );
            return getTagsList();
        })
        .then((data) => {
            tagsData = data;
            renderStorageList();
            renderStorageDatalist();
        })
        .catch((reason) => {
            console.log(reason);
        });
}

function initPage() {
    updateStorageList();
    setUpAutoLogOut("/admin");
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

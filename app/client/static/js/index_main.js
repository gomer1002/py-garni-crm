"use strict";

let menuData = {};
let tagsData = {};
let cartData = {};
let userData = {};
let orderData = {};

let sortBy = "sortName";
let sortDirection = 1;
let sortNumber = false;

function getTagsList() {
    let tags = [];
    for (let k of Object.keys(menuData)) {
        let instance = menuData[k];
        if (instance.tags) {
            for (let tag of instance.tags) {
                if (tags.indexOf(tag) == -1) {
                    tags.push(tag);
                }
            }
        }
    }
    return tags;
}

function switchElem(elem, state) {
    if (state == "on") {
        if (elem.classList.contains("display-none")) {
            elem.classList.remove("display-none");
        }
    }
    if (state == "off") {
        if (!elem.classList.contains("display-none")) {
            elem.classList.add("display-none");
        }
    }
}

function filterItemsBy(elem) {
    let recordList = elem
        .closest("#menuContainer")
        .querySelectorAll("[data-sort-tags]");
    let recordListArray = Array.from(recordList);
    let inputTags = elem
        .closest("#menuContainer")
        .querySelector("#menuTagsContainer")
        .querySelectorAll("input");
    let badge = elem.closest("#menuContainer").querySelector("#checkedTagsQty");
    let search_input = elem.closest("#menuContainer").querySelector("input");
    let search_val = search_input.value.toLowerCase();
    let checked = 0;
    let equal = 0;
    for (let input_tag of inputTags) {
        checked += input_tag.checked ? 1 : 0;
    }
    if (checked != 0) {
        for (let record of recordListArray) {
            //
            equal = 0;
            for (let input_tag of inputTags) {
                let value = input_tag.value.toLowerCase();
                let state = input_tag.checked;
                if (state) {
                    if (
                        record.dataset.sortTags.toLowerCase().includes(value) &&
                        record.dataset.sortName
                            .toLowerCase()
                            .includes(search_val)
                    ) {
                        equal += 1;
                    }
                }
            }
            if (checked == equal) {
                switchElem(record, "on");
            } else {
                switchElem(record, "off");
            }
        }
    }
    if (checked == 0) {
        searchItem(elem);
    }
    if (checked == 0) {
        switchElem(badge, "off");
    } else {
        switchElem(badge, "on");
        badge.innerHTML = checked;
    }
}

function searchItem(
    elem,
    container_tag = "#menuContainer",
    dataset_selector = "[data-sort-name]"
) {
    let search_input = elem.closest(container_tag).querySelector("input");
    let search_val = search_input.value.toLowerCase();
    let recordList = elem
        .closest(container_tag)
        .querySelectorAll(dataset_selector);
    let recordListArray = Array.from(recordList);
    for (let record of recordListArray) {
        if (record.dataset.sortName.toLowerCase().includes(search_val)) {
            switchElem(record, "on");
        } else {
            switchElem(record, "off");
        }
    }
}

function searchTag(elem, clear = false) {
    let search_input = elem
        .closest("#menuTagsContainer")
        .querySelector("input");
    let search_val = search_input.value.toLowerCase();
    let recordList = elem
        .closest("#menuTagsContainer")
        .querySelectorAll("input[type=checkbox");
    let recordListArray = Array.from(recordList);
    for (let record of recordListArray) {
        if (clear) {
            search_input.value = "";
            switchElem(record.parentNode, "on");
        } else {
            if (record.value.toLowerCase().includes(search_val)) {
                switchElem(record.parentNode, "on");
            } else {
                switchElem(record.parentNode, "off");
            }
        }
    }
}

function clearSearch(elem) {
    let input = elem.closest("#menuContainer").querySelector("input");
    input.value = "";
    let inputTags = elem
        .closest("#menuContainer")
        .querySelector("#menuTagsContainer")
        .querySelectorAll("input");
    for (let input_tag of inputTags) {
        if (input_tag.type == "checkbox") {
            input_tag.checked = false;
            switchElem(input_tag.parentNode, "on");
        }
        if (input_tag.type == "text") {
            input_tag.value = "";
        }
    }
    filterItemsBy(input);
}

function renderSearchTags() {
    let menuTagsContainer = document.querySelector("#menuTagsContainer");
    for (let tag of tagsData) {
        let tagItem = document.createElement("div");
        tagItem.classList = "form-check";
        tagItem.innerHTML = `
        <input
            class="form-check-input"
            type="checkbox"
            id="item_tag_${tag}"
            value="${tag}"
            name="${tag}"
            onclick="filterItemsBy(this)"
        />
        <label
            class="form-check-label"
            for="item_tag_${tag}"
            >${tag}</label
        >`;
        menuTagsContainer.appendChild(tagItem);
    }
}

function renderNavBar() {
    let nav = document.querySelector("#navbarLinksList");
    if (getCookie("access_token_cookie") == undefined) {
        let li = document.createElement("li");
        li.innerHTML = `<a class="dropdown-item" href="/login">Вход</a>`;
        nav.appendChild(li);
    } else {
        let li = document.createElement("li");
        li.innerHTML = `<a class="dropdown-item" href="#" data-mdb-target="#orderListModal" data-mdb-toggle="modal">Мои заказы</a>`;
        nav.appendChild(li);

        li = document.createElement("li");
        li.innerHTML = `<div
                            class="dropdown-item"
                        >
                            <input
                                class="form-check-input js-push-btn me-2"
                                type="checkbox"
                                value=""
                                id="show_input"
                                name="show_input"
                            />
                            <label
                                class="form-check-label"
                                for="show_input"
                            >
                                Push-уведомления
                            </label>
                        </div>`;
        // li.innerHTML = `<button disabled class="js-push-btn">
        //                     Enable Push Messaging
        //                 </button>`;
        nav.appendChild(li);

        li = document.createElement("li");
        li.innerHTML = `<a class="dropdown-item" href="#" onclick="log_out_me()">Выход</a>`;
        nav.appendChild(li);
    }
}

function invert(k) {
    return -parseInt(k);
}

function comparator(a, b) {
    if (sortNumber) {
        if (parseFloat(a.dataset[sortBy]) < parseFloat(b.dataset[sortBy]))
            return sortDirection;
        if (parseFloat(a.dataset[sortBy]) > parseFloat(b.dataset[sortBy]))
            return sortDirection * -1;
    } else {
        if (a.dataset[sortBy] < b.dataset[sortBy]) return sortDirection;
        if (a.dataset[sortBy] > b.dataset[sortBy]) return sortDirection * -1;
    }
    return 0;
}

function switchSortControls(elem, direction) {
    let container = elem.closest("#menuContainer");
    let controls_containers = container.querySelectorAll(".sort-controls");
    for (let each_cc of controls_containers) {
        switchElem(each_cc.querySelector(".sort-no"), "off");
        switchElem(each_cc.querySelector(".sort-down"), "off");
        switchElem(each_cc.querySelector(".sort-up"), "off");
        if (elem == each_cc.parentNode) {
            if (direction > 0) {
                switchElem(each_cc.querySelector(".sort-up"), "on");
            } else {
                switchElem(each_cc.querySelector(".sort-down"), "on");
            }
        } else {
            switchElem(each_cc.querySelector(".sort-no"), "on");
        }
    }
}

// Function to sort Data
function sortData(elem) {
    let sortSelector = elem.dataset.sortSelector;
    let sortSwap = elem.dataset.sortSwap;
    sortNumber = elem.dataset.sortNumber;
    sortBy = elem.dataset.sortBy;
    sortDirection = sortSwap
        ? elem.dataset.sortDirection * -1
        : elem.dataset.sortDirection;
    elem.dataset.sortDirection = invert(elem.dataset.sortDirection);
    switchSortControls(elem, elem.dataset.sortDirection);

    let subjects = document.querySelectorAll(`[${sortSelector}]`);
    let subjectsArray = Array.from(subjects);
    let sorted = subjectsArray.sort(comparator);
    sorted.forEach((e) => elem.closest("#menuContainer").appendChild(e));
}

function windowIndexReadyFunc() {
    const promise1 = new Promise((resolve, reject) => {
        resolve(renderNavBar());
    }).then(() => {
        if (getCookie("access_token_cookie") != undefined) {
            initPush();
        }
    });

    const promise2 = new Promise((resolve, reject) => {
        resolve(getDataFrom("api/menu/get"));
    }).then((data) => {
        menuData = data;
        tagsData = getTagsList();
        renderSearchTags();
        renderMenuList(menuData);
        recountCart();
        const promise2 = new Promise((resolve, reject) => {
            resolve(getOrderData());
        }).then((data) => {
            orderData = data;
            renderOrderList(orderData);
        });
    });
}

window.onload = windowIndexReadyFunc;

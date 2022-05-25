"use strict";

let sortBy = "updateDate";
let sortDirection = 1;
let sortNumber = false;

function invert(k) {
    return -parseInt(k);
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
    let container = elem.closest(".list-group-item");
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
    sorted.forEach((e) => elem.closest("ul").appendChild(e));
}

function searchData(elem) {
    let subjects =
        elem.parentNode.parentNode.querySelectorAll(`[data-sort-name]`);
    let subjectsArray = Array.from(subjects);
    for (let form of subjectsArray) {
        let state = {
            ">":
                parseInt(form.dataset.sortAmount) >
                parseInt(elem.value.replace(/\D/g, "")),
            "<":
                parseInt(form.dataset.sortAmount) <
                parseInt(elem.value.replace(/\D/g, "")),
            "=":
                parseInt(form.dataset.sortAmount) ==
                parseInt(elem.value.replace(/\D/g, "")),
        };
        if (Object.keys(state).indexOf(elem.value[0]) != -1) {
            if (state[elem.value[0]]) {
                switchElem(form, "on");
            } else {
                switchElem(form, "off");
            }
        } else if (
            form.dataset.sortName
                .toLowerCase()
                .includes(elem.value.toLowerCase())
        ) {
            switchElem(form, "on");
        } else {
            switchElem(form, "off");
        }
    }
}

function clearSearch(elem) {
    let input = elem.parentNode.querySelector("input");
    input.value = "";
    searchData(input);
}

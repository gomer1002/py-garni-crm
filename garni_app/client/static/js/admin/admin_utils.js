"use strict";

const sortSettings = ({
    by = "",
    sel = "",
    dir = 1,
    num = false,
    swap = false,
} = {}) => {
    return `
    onclick="sortData(this)"
    data-sort-by="${by}"
    data-sort-selector="${sel}"
    data-sort-direction="${dir}"
    data-sort-number="${num}"
    data-sort-swap="${swap}"
    `;
};

const sortControls = `
<div class="sort-controls ps-1">
    <i class="fas fa-caret-right sort-no"></i>
    <i class="fas fa-caret-down sort-down display-none"></i>
    <i class="fas fa-caret-up sort-up display-none"></i>
</div>`;

const dropdownControls = `
data-mdb-toggle="dropdown"
aria-expanded="false"
style="cursor: pointer"
onmouseenter="new mdb.Dropdown(this).show()"
onmouseleave="new mdb.Dropdown(this).hide()"`;

function sortObject(obj, comparator, id_selector) {
    let sorted_obj = {};
    for (let elem of Object.values(obj).sort(comparator)) {
        sorted_obj[elem[id_selector]] = elem;
    }
    return sorted_obj;
}

function storage_obj_comparator(a, b) {
    if (a.ingredient_name > b.ingredient_name) return 1;
    if (a.ingredient_name < b.ingredient_name) return -1;
    return 0;
}

function menu_obj_comparator(a, b) {
    if (a.item_name > b.item_name) return 1;
    if (a.item_name < b.item_name) return -1;
    return 0;
}

function user_obj_comparator(a, b) {
    if (a.name > b.name) return 1;
    if (a.name < b.name) return -1;
    return 0;
}

"use strict";

// :: Header Cart Active Code
let cartOverlay = document.querySelector(".cart-bg-overlay");
let cartWrapper = document.querySelector(".right-side-cart-area");
let essenceCartBtn = document.querySelector("#essenceCartBtn");
let cartOverlayOn = "cart-bg-overlay-on";
let cartOn = "cart-on";

let orderOverlay = document.querySelector(".order-bg-overlay");
let orderWrapper = document.querySelector(".right-side-order-area");
let essenceOrderBtn = document.querySelector("#essenceOrderBtn");
let orderOverlayOn = "order-bg-overlay-on";
let orderOn = "order-on";

let userOverlay = document.querySelector(".user-bg-overlay");
let userWrapper = document.querySelector(".left-side-user-area");
let essenceUserBtn = document.querySelector("#essenceUserBtn");
let userOverlayOn = "user-bg-overlay-on";
let userOn = "user-on";

let menuItemOverlay = document.querySelector(".menu-item-bg-overlay");
let menuItemWrapper = document.querySelector(".right-side-menu-item-area");
let menuItemOverlayOn = "menu-item-bg-overlay-on";
let menuItemOn = "menu-item-on";

let modal_swipe = { right: essenceCartBtn, left: essenceUserBtn };

let menuData = {};
let tagsData = {};
let categoriesData = {};
let cartData = {};
let userData = {};
let orderData = {};

function getTagsList() {
    let tags = [];
    for (let k of Object.keys(menuData)) {
        let instance = menuData[k];
        if (instance.tags && instance.show) {
            for (let tag of instance.tags) {
                if (tags.indexOf(tag) == -1) {
                    tags.push(tag);
                }
            }
        }
    }
    return tags.sort();
}

function getMenuCategoriesList() {
    let categories = [];
    for (let k of Object.keys(menuData)) {
        let instance = menuData[k];
        let category = instance.category;
        if (category && instance.show) {
            if (categories.indexOf(category) == -1) {
                categories.push(category);
            }
        }
    }
    return categories.sort();
}

function filterCategoryWrappers() {
    for (let elem of document.querySelectorAll(".category-wrapper")) {
        if (
            elem.querySelectorAll(".item-wrapper:not(.display-none)").length ==
            0
        ) {
            switchElem(elem, "off");
        } else {
            switchElem(elem, "on");
        }
    }
}

function filterItemsBy() {
    let recordList = document
        .querySelector("#menuContainer")
        .querySelectorAll("[data-sort-tags]");
    let recordListArray = Array.from(recordList);

    let inputTags = document
        .querySelector("#menuTagsContainer")
        .querySelectorAll("input");

    let search_input = document.querySelector("#menuSearchInput");
    let search_val = search_input.value.toLowerCase();
    let checked = 0;
    let equal = 0;
    for (let input_tag of inputTags) {
        checked += input_tag.checked ? 1 : 0;
    }
    if (checked != 0) {
        for (let record of recordListArray) {
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
        searchItem();
    } else {
        filterCategoryWrappers();
    }
}

function searchItem() {
    let search_input = document.querySelector("#menuSearchInput");
    let search_val = search_input.value.toLowerCase();

    let recordList = document
        .querySelector("#menuContainer")
        .querySelectorAll("[data-sort-name]");

    let recordListArray = Array.from(recordList);
    for (let record of recordListArray) {
        if (record.dataset.sortName.toLowerCase().includes(search_val)) {
            switchElem(record, "on");
        } else {
            switchElem(record, "off");
        }
    }

    filterCategoryWrappers();
}

function renderSearchTags() {
    let menuTagsContainer = document.querySelector("#menuTagsContainer");
    let k = 0;
    for (let tag of tagsData) {
        let tagItem = document.createElement("div");
        tagItem.classList = "filter-item";
        tagItem.innerHTML = `
        <input
            class="filter-check"
            type="checkbox"
            id="item_tag_${k}"
            value="${tag}"
            onclick="filterItemsBy()"
        />
        <label
            for="item_tag_${k}"
            ><i class="fas fa-heart"></i>${tag}</label
        >`;
        menuTagsContainer.appendChild(tagItem);
        k++;
    }
}

function renderNavBar(data) {
    let userName = document.querySelector("#userName");

    let navMenu = document.querySelector("#nav-category-list");
    let footerMenu = document.querySelector(".footer_menu").querySelector("ul");

    if (getCookie("access_token_cookie") != undefined) {
        let jwt = parseJwt(getCookie("access_token_cookie"));

        if (jwt.rights.indexOf("access_user_panel") == -1) {
            showAlert({
                message: "Недостаточно прав для доступа в личный кабинет! ",
                type: "warning",
            });
            essenceUserBtn.addEventListener("click", function () {
                window.location.href = "/login";
            });
            log_out_me(null);
        } else {
            userName.innerHTML = jwt.name;
            essenceUserBtn.addEventListener("click", function () {
                addClass(userOverlay, userOverlayOn);
                addClass(userWrapper, userOn);
                document.dispatchEvent(cart_state_changed_evt);
            });
        }
    } else {
        essenceUserBtn.addEventListener("click", function () {
            window.location.href = "/login";
        });
    }

    for (let category of data) {
        let li = document.createElement("li");
        li.innerHTML = `<a href="#${category}">${category}</a>`;
        navMenu.appendChild(li);
        footerMenu.appendChild(li.cloneNode(true));
    }
}

document.addEventListener("cart_state_changed", function () {
    if (orderWrapper.classList.contains(orderOn)) {
        modal_swipe = { right: null, left: orderOverlay };
    } else if (menuItemWrapper.classList.contains(menuItemOn)) {
        modal_swipe = {
            right: null,
            left: menuItemOverlay,
        };
    } else if (cartWrapper.classList.contains(cartOn)) {
        modal_swipe = {
            right: empty_cart ? null : essenceOrderBtn,
            left: cartOverlay,
        };
    } else if (userWrapper.classList.contains(userOn)) {
        modal_swipe = {
            right: userOverlay,
            left: null,
        };
    } else {
        modal_swipe = { right: essenceCartBtn, left: essenceUserBtn };
    }
});

function windowIndexReadyFunc() {
    const promise2 = new Promise((resolve, reject) => {
        resolve(getDataFrom("api/menu/get"));
    }).then((data) => {
        menuData = data;
        tagsData = getTagsList();
        categoriesData = getMenuCategoriesList();
        renderSearchTags();
        renderMenuList(menuData);
        renderNavBar(categoriesData);
        recountCart();
        initPush();

        const promise2 = new Promise((resolve, reject) => {
            resolve(getOrderData());
        }).then((data) => {
            orderData = data;
            renderOrderList(orderData);
        });
    });

    essenceCartBtn.addEventListener("click", function () {
        addClass(cartOverlay, cartOverlayOn);
        addClass(cartWrapper, cartOn);
        document.dispatchEvent(cart_state_changed_evt);
    });
    cartOverlay.addEventListener("click", function () {
        removeClass(cartOverlay, cartOverlayOn);
        removeClass(cartWrapper, cartOn);
        document.dispatchEvent(cart_state_changed_evt);
    });

    essenceOrderBtn.addEventListener("click", function () {
        addClass(orderOverlay, orderOverlayOn);
        addClass(orderWrapper, orderOn);
        document.dispatchEvent(cart_state_changed_evt);
    });
    orderOverlay.addEventListener("click", function () {
        removeClass(orderOverlay, orderOverlayOn);
        removeClass(orderWrapper, orderOn);
        document.dispatchEvent(cart_state_changed_evt);
    });

    userOverlay.addEventListener("click", function () {
        removeClass(userOverlay, userOverlayOn);
        removeClass(userWrapper, userOn);
        document.dispatchEvent(cart_state_changed_evt);
    });

    menuItemOverlay.addEventListener("click", function () {
        removeClass(menuItemOverlay, menuItemOverlayOn);
        removeClass(menuItemWrapper, menuItemOn);
        document.dispatchEvent(cart_state_changed_evt);
        setTimeout(() => {
            renderMenuItemModal(null, true);
        }, 200);
    });

    window.addEventListener("scroll", function () {
        if (window.scrollY > 0) {
            addClass(this.document.querySelector(".header_wrapper"), "sticky");
            if (window.scrollY > 150) {
                renderScrollArrow();
            }
        } else {
            removeClass(
                this.document.querySelector(".header_wrapper"),
                "sticky"
            );
            renderScrollArrow(true);
        }
    });

    document.querySelectorAll(".prevent-transition").forEach((elem) => {
        elem.classList.remove("prevent-transition");
    });
}

window.onload = windowIndexReadyFunc;

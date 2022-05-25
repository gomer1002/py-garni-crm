"use strict";

let cardsData = {};
let storageData = {};
let ordersData = {};
let userData = {};
let menuData = {};

function removeWarning(elem) {
    elem.closest(".container").style.display = "none";
}

function confirmOrder(elem) {
    let order_id = elem.dataset.orderId;
    // console.log("confirm order ", order_id);
    let order_data = { order_id: order_id };
    toggleSubmitSpinner(elem);

    axios
        .post("/api/order/confirm", order_data)
        .then(function (response) {
            toggleSubmitSpinner(elem);
            console.log(response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                document.querySelector(`#order_${order_id}`).remove();
                if (response.data.data) {
                    for (let warning of response.data.data) {
                        let i_name =
                            storageData[warning.ingredient_id].ingredient_name;
                        let i_amount = warning.amount;
                        let i_m_amount = warning.min_amount;
                        showAlert({
                            message: `На складе кончается ${i_name}. Осталось ${i_amount}, минимальное значение ${i_m_amount}. Нажмми чтобы скрыть.`,
                            type: "warning",
                            auto_dispose: false,
                        });
                    }
                }
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            toggleSubmitSpinner(elem);
            // console.log(error.response.data);
            showAlert({ message: error.response.data.message, type: "danger" });
        });
}

function getOrderCard(order_id, order_items_list) {
    return `
    <div class="card-body container p-0 ">
        <ul class="list-group list-group-light accordion order-list-card" id="userOrdersList">
            <li class="list-group-item d-flex flex-fill justify-content-between align-items-start p-2 order-list-item" id="">
                <div class="flex-fill">
                    <h4>${order_id}</h4>
                    ${order_items_list}
                </div>
            </li>
        </ul>
        <div class="d-flex justify-content-between flex-column align-items-start p-2">
            <div class="card-btn d-flex pb-1 justify-content-end align-items-end">
                <button type="button" class="btn btn-outline-dark btn-rounded" data-mdb-ripple-color="dark" data-order-id="${order_id}"data-submit-button="Confirm<i class='fas fa-check ps-2'></i>" onclick="confirmOrder(this)">Confirm<i class="fas fa-check ps-2"></i></button>
            </div>
            <div class="d-flex justify-content-center align-items-center" style="position: absolute; right: 50%;">
                <div class="spinner-border" role="status" style="display: none;" id="spinner_${order_id}">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
            </div>
        </div>
    </div>
    `;
}

function getOrderItem(
    order_id,
    item_name,
    item_id,
    item_qty,
    ingredients_list
) {
    if (ingredients_list) {
        return `
        <div class="container p-0">
            <div class="d-flex justify-content-between align-items-center my-1" id="order_id1_ingredient_id1">
                <a href="#" class="fw-bold accordion-button p-0 collapsed" type="button" data-mdb-toggle="collapse" data-mdb-target="#collapse_${order_id}_${item_id}" aria-expanded="false" aria-controls="collapse_${order_id}_${item_id}" style="width: auto;">
                    ${item_name}
                    </a>
                <span class="ps-2">${item_qty}</span>
            </div>
            <div id="collapse_${order_id}_${item_id}" class="accordion-collapse collapse">
                ${ingredients_list}
            </div>
        </div>`;
    } else {
        return `
        <div class="container p-0">
            <div class="d-flex justify-content-between align-items-center my-1" id="order_id1_ingredient_id1">
                <span class="fw-bold p-0" style="color: #4f4f4f;"> ${item_name} </span>
                <span class="ps-2">${item_qty}</span>
            </div>
        </div>`;
    }
}

function getCompositionItem(
    ingredient_name,
    ingredient_weight,
    ingredient_unit
) {
    return `
    <div class="d-flex justify-content-between align-items-center ps-4 py-1">
        <span>${ingredient_name}</span>
        <div>
            <span>${ingredient_weight}</span>
            <span>${ingredient_unit}</span>
        </div>
    </div>
    `;
}

function reloadOrdersCartList() {
    new Promise((resolve) => {
        resolve(
            getDataFrom(
                "/api/order/get?order_status=payed&light=True&sort_direction=asc"
            )
        );
    }).then((data) => {
        ordersData = data;
        renderOrderCards();
    });
}

function pushOrderCard(order_id, order_card) {
    let div = document.createElement("div");
    div.classList = ["mt-3 px-2"];
    div.innerHTML = order_card;
    div.id = `order_${order_id}`;
    document.querySelector("#orderContainer").appendChild(div);
}

function renderOrderCards() {
    document.querySelector("#orderContainer").innerHTML = "";
    for (let order_key of Object.keys(ordersData)) {
        let order = ordersData[order_key]; // объект заказа
        let order_id = order.order_id;
        let items_list = order.items_list; // список заказанных блюд [{}, {}, ...]
        let order_type = order.order_type;

        let order_data_string = "";
        for (let item_key of Object.keys(items_list)) {
            let item = items_list[item_key]; // объект заказа {item_id: ***, qty: ***}
            let item_id = item.item_id;
            let item_qty = item.qty;
            let menu_item = menuData[item_id]; // карточка меню конкретного блюда
            let menu_item_name = menu_item.item_name;
            let composition_data_string = "";

            let composition = menu_item.composition;
            for (let composition_key of Object.keys(composition)) {
                let composition_data = composition[composition_key];
                let ingredient_id = composition_data.ingredient_id;
                let ingredient_amount = composition_data.amount;
                let actual_amount = ingredient_amount * item_qty;
                let storage_item = storageData[ingredient_id]; // объект ингредиента на складе
                let storage_item_name = storage_item.ingredient_name;
                let storage_item_unit = storage_item.unit;
                let storage_item_tags = storage_item.tags; // список тэгов ингредиента

                composition_data_string += getCompositionItem(
                    storage_item_name,
                    actual_amount,
                    storage_item_unit
                );
            }

            order_data_string += getOrderItem(
                order_id,
                menu_item_name,
                item_id,
                item_qty,
                composition_data_string
            );
        }

        let finally_order_card = getOrderCard(order_id, order_data_string);
        pushOrderCard(order_id, finally_order_card);
    }
}

function windowReadyFunc() {
    // renderNavBar();
    const promise1 = new Promise((resolve, reject) => {
        resolve(getDataFrom("/api/storage/get"));
    })
        .then((data) => {
            storageData = data;
            return getDataFrom("/api/menu/get");
        })
        .then((data) => {
            menuData = data;
            return getDataFrom(
                "/api/order/get?order_status=payed&light=True&sort_direction=asc"
            );
        })
        .then((data) => {
            ordersData = data;
            console.log("all done");
            setUpAutoLogOut("/kitchen");
            renderOrderCards();
        })
        .catch((reason) => {
            console.log(reason);
        });
}

document.addEventListener("DOMContentLoaded", windowReadyFunc);

"use strict";

let cardsData = {};
let storageData = {};
let ordersData = {};
let userData = {};
let menuData = {};
let typeMessages = {
    delivery: "Доставка",
    pickup: "С собой",
    dine_in: "В зале",
};

function confirmOrder(elem) {
    let order_id = elem.dataset.orderId;
    // console.log("confirm order ", order_id);
    let order_data = { order_id: order_id };
    toggleSubmitSpinner(elem);

    axios
        .post("/api/order/confirm", order_data)
        .then(function (response) {
            toggleSubmitSpinner(elem);
            // console.log(response.data);
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
            // console.log(error);
            showAlert({ message: error.response.data.message, type: "danger" });
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getOrderCard(
    order_id,
    order_id_short,
    order_type,
    order_date,
    order_items_list
) {
    let date_string = order_date.toLocaleDateString("ru-RU");
    let time_string = order_date.toLocaleTimeString("ru-RU");
    return `
    <div class="card-body p-0 ">
        <ul 
            class="order-list-card list-group list-group-light accordion"
        >
            <li 
                class="list-group-item d-flex align-items-center justify-content-between p-2 pe-3"
            >
                <div class="order-desc">
                    <h4>Заказ #${order_id_short}</h4>
                    <p class="order-date">${time_string} ${date_string}</p>
                    <p class="order-type">${typeMessages[order_type]}</p>
                </div>
                <div class="order-btn">
                    <button 
                        type="button" 
                        class="btn btn-outline-dark 
                        btn-floating" 
                        ata-mdb-ripple-color="dark" 
                        data-order-id="${order_id}"
                        data-submit-button="<i lass='fas fa-check'></i>" 
                        onclick="confirmOrder(this)" 
                    >
                        <i class="fas fa-check"></i>
                    </button>
                    <p class="order-timer" data-order-id=${order_id}></p>
                </div>
            </li>
            <li class="list-group-item p-2 pe-3">
                ${order_items_list}
            </li>
        </ul>
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
    return `
        <div class="row p-0">
            <div class="d-flex justify-content-between align-items-center my-1">
                <p 
                    class="fw-bold accordion-button p-0 m-0 collapsed" 
                    data-mdb-toggle="collapse" 
                    data-mdb-target="#collapse_${order_id}_${item_id}" 
                    aria-expanded="false" 
                    aria-controls="collapse_${order_id}_${item_id}" 
                    style="width: auto;" 
                >
                    ${item_name}
                </p>
                <span class="ps-2">${item_qty}</span>
            </div>
            <div 
                id="collapse_${order_id}_${item_id}"
                class="accordion-collapse collapse"
            >
                ${ingredients_list}
            </div>
        </div>`;
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
        setUpOrderTimers();
    });
}

function pushOrderCard(order_id, order_card) {
    let div = document.createElement("div");
    div.classList = ["col-12 col-md-6 col-xl-4 mt-3 px-2 card-wrapper"];
    div.id = `order_${order_id}`;
    div.innerHTML = order_card;
    document.querySelector("#orderContainer").appendChild(div);
}

function renderOrderCards() {
    document.querySelector("#orderContainer").innerHTML = "";
    for (let order_key of Object.keys(ordersData)) {
        let order = ordersData[order_key]; // объект заказа
        let order_id = order.order_id;
        let order_id_short = order_id.split("-")[0];
        let order_date = new Date(order.payed_on_unix * 1000);
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

        let finally_order_card = getOrderCard(
            order_id,
            order_id_short,
            order_type,
            order_date,
            order_data_string
        );
        pushOrderCard(order_id, finally_order_card);
    }
}

function div(val, by) {
    return (val - (val % by)) / by;
}

function formatTime(val) {
    return div(val, 10) > 0 ? val : `0${val}`;
}

function updateOrderTimer(elem, origin_date) {
    let elapsed = parseInt(
        (new Date().getTime() - origin_date.getTime()) / 1000
    );

    let hour = div(elapsed, 3600);
    let minutes = div(elapsed % 3600, 60);
    let seconds = (elapsed % 3600) % 60;

    elem.innerHTML = `${formatTime(hour)}:${formatTime(minutes)}:${formatTime(
        seconds
    )}`;
}

function setUpOrderTimers() {
    let timers = document.querySelectorAll(".order-timer");
    for (let timer of timers) {
        let order_id = timer.dataset.orderId;
        let order_date = new Date(ordersData[order_id].payed_on_unix * 1000);
        setInterval(updateOrderTimer, 450, timer, order_date);
    }
}

function windowReadyFunc() {
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
            setUpAutoLogOut("/kitchen");
            renderOrderCards();
            setUpOrderTimers();
        })
        .catch((reason) => {
            print(reason);
        });
}

document.addEventListener("DOMContentLoaded", windowReadyFunc);

"use strict";

function getOrderData() {
    let cookie = getCookie("access_token_cookie");
    if (cookie) {
        let jwt = parseJwt(cookie);
        let user_id = jwt.sub;
        return getDataFrom(
            `/api/order/get?user_id=${user_id}&light=True&sort_direction=desc`
        );
    }
}

function reloadOrderList() {
    document.querySelector("#userOrdersList").innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="position: absolute; right: 50%;">
        <div class="spinner-border" role="status" id="reloadOrderSpinner">
            <span class="visually-hidden">Загрузка...</span>
        </div>
    </div>`;
    new Promise((resolve) => {
        resolve(getOrderData());
    }).then((data) => {
        orderData = data;
        renderOrderList(orderData);
        document.querySelector("#reloadOrderSpinner").remove();
    });
}

function renderOrderList(data) {
    // let month = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь", ];
    // let day = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", ];
    let orderColours = {
        pending: "danger",
        payed: "warning",
        succeeded: "success",
        canceled: "light",
    };
    let statusMessages = {
        pending: "Не оплачен",
        payed: "Готовится",
        succeeded: "Готов",
        canceled: "Отменен",
    };
    let typeMessages = {
        delivery: "Доставка",
        pickup: "С собой",
        dine_in: "В зале",
    };

    const getPayElem = (order_id, order_status) => {
        if (order_status == "pending") {
            return `
                <a href="/purshare?order_id=${order_id}" class="badge rounded-pill badge-primary m-1">Оплатить</a>
                `;
        } else {
            return ``;
        }
    };

    const getOrdersListBody = (
        order_id,
        order_status,
        items_list_str,
        created_date_out,
        price,
        order_type
    ) => {
        return `
            <div class="flex-fill pe-3 col-12 col-sm-9 col-md-10">
                <h2>
                    <p class="fw-bold accordion-button collapsed p-0 mb-1" data-mdb-toggle="collapse" data-mdb-target="#collapse_${order_id}" aria-expanded="false" aria-controls="collapse_${order_id}">
                    Заказ #${order_id}
                    </p>
                </h2>
                <div id="collapse_${order_id}" class="accordion-collapse collapse">
                    ${items_list_str}
                    <div class="d-flex justify-content-between align-items-center">
                        <span>${created_date_out}</span>
                        <span>${price} ₽</span>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-wrap justify-content-center col-12 col-sm-3 col-md-2">
                <span class="badge rounded-pill badge-${
                    orderColours[order_status]
                } col-5 col-sm-12 col-md-12 m-1">${
            statusMessages[order_status]
        }</span>
                <span class="badge rounded-pill badge-light col-5 col-sm-12 col-md-12 m-1">${
                    typeMessages[order_type]
                }</span>
                ${getPayElem(order_id, order_status)}
            </div>
            `;
    };

    const getOneMenuItem = (item_name, item_qty) => {
        return `
        <div class="d-flex justify-content-between align-items-center my-1">
            <span>${item_name}</span>
            <span>${item_qty}</span>
        </div>
        `;
    };
    if (data) {
        for (let key of Object.keys(data)) {
            let order_id = data[key].order_id;
            let order_id_short = order_id.split("-")[0];
            let order_status = data[key].order_status;
            let price = data[key].price;
            let order_type = data[key].order_type;

            let created_date_obj = new Date(data[key].created_on_unix * 1000);
            let c_date = created_date_obj.toLocaleDateString("ru-RU");
            let c_time = created_date_obj.toLocaleTimeString("ru-RU");
            let created_date_out = `${c_date} ${c_time}`;

            let items_list = {};
            let items_list_str = ``;
            for (let k of Object.keys(data[key].items_list)) {
                let item = data[key].items_list[k];
                let item_key = item.item_id;
                let item_qty = item.qty;
                let item_name = menuData[item_key].item_name;
                items_list[item_key] = { qty: item_qty, name: item_name };
            }
            for (let k of Object.keys(items_list)) {
                items_list_str += getOneMenuItem(
                    items_list[k].name,
                    items_list[k].qty
                );
            }
            const userOrdersList = document.querySelector("#userOrdersList");
            let li = document.createElement("li");
            li.classList = [
                "list-group-item d-flex justify-content-between flex-wrap align-items-center p-2 order-list-item",
            ];
            li.innerHTML = getOrdersListBody(
                order_id_short,
                order_status,
                items_list_str,
                created_date_out,
                price,
                order_type
            );
            userOrdersList.appendChild(li);
        }
    } else {
        const userOrdersList = document.querySelector("#userOrdersList");
        let p = document.createElement("p");
        p.classList = ["note note-warning m-0"];
        p.style = "width: 100%;";
        p.innerHTML = `Список заказов пуст`;
        userOrdersList.appendChild(p);
    }
}

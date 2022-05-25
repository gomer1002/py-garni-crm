"use strict";

let totalQty = 0;
let totalPrice = 0;
const orderTypeForm = document.querySelector("#orderTypeForm");
orderTypeForm.addEventListener("submit", placeOrder);

const deliveryInfo = document.querySelector("#deliveryInfo");

const spinner = document.querySelector(".spinner-border");

function addToCart(item_id) {
    let cartData = JSON.parse(localStorage.getItem("user_cart"));
    if (!cartData) {
        cartData = {};
    }
    let cart_item = cartData[item_id];
    if (cart_item) {
        cartData[item_id].qty++;
    } else {
        cartData[item_id] = {
            item_id: item_id,
            item_name: menuData[item_id]["item_name"],
            price: menuData[item_id]["price"],
            tags: menuData[item_id]["tags"],
            img_urls: menuData[item_id]["img_urls"],
            qty: 1,
        };
        renderCartItem(cartData[item_id]);
    }
    // console.log('added to cart item ', cartData);
    localStorage.setItem("user_cart", JSON.stringify(cartData));
    recountCart();
}

function removeFromCart(item_id, remove = false) {
    let cartData = JSON.parse(localStorage.getItem("user_cart"));
    if (!cartData) {
        return;
    }
    let cart_item = cartData[item_id];
    if (cart_item) {
        if (cartData[item_id].qty == 1 || remove) {
            delete cartData[item_id];
            document.querySelector(`#cart_item_${item_id}`).outerHTML = "";
        } else {
            cartData[item_id].qty--;
        }
    } else {
        return;
    }
    localStorage.setItem("user_cart", JSON.stringify(cartData));
    // console.log('added to cart item ', item_id);
    recountCart();
}

function clearCart() {
    let cartDataString = localStorage.getItem("user_cart");
    if (cartDataString) {
        cartData = JSON.parse(cartDataString);
        totalQty = 0;
        totalPrice = 0;
        for (let key of Object.keys(cartData)) {
            removeFromCart(key, true);
        }
        document.querySelector("#cartTotalQty").innerHTML =
            totalQty > 0 ? totalQty : "";
    }
}

function showNoteEmptyCart() {
    document.querySelector("#cartTotalBlock").style.display = "none";
    document.querySelector("#cartWarning").style.display = "inline-block";
    document.querySelector("#orderModalButton").disabled = true;
}

function recountCart() {
    let cartDataString = localStorage.getItem("user_cart");
    if (!cartDataString) {
        showNoteEmptyCart();
        return;
    }
    cartData = JSON.parse(cartDataString);
    if (Object.keys(cartData).length == 0) {
        showNoteEmptyCart();
        return;
    }
    totalQty = 0;
    totalPrice = 0;
    for (let key of Object.keys(cartData)) {
        let items_price = cartData[key].qty * cartData[key].price;
        totalQty += cartData[key].qty;
        totalPrice += items_price;
        if (!document.querySelector(`#cart_item_${key}`)) {
            renderCartItem(cartData[key]);
        }
        document.querySelector(`#item_qty_${key}`).innerHTML =
            cartData[key].qty;
        document.querySelector(`#item_price_${key}`).innerHTML =
            items_price.toFixed(2);
    }
    document.querySelector("#cartTotal").innerHTML = totalPrice.toFixed(2);
    document.querySelector("#cartTotalBlock").style.display = "inline-block";
    document.querySelector("#cartTotalQty").innerHTML =
        totalQty > 0 ? totalQty : "";
    document.querySelector("#cartWarning").style.display = "none";
    document.querySelector("#orderModalButton").disabled = false;
}

function changeOrderForm() {
    let radio = orderTypeForm.orderTypeRadio.value;
    let orderDeliveryAddresString = localStorage.getItem("delivery_addres");

    if (radio == "delivery") {
        deliveryInfo.style.display = "block";
        setRequiredDeliveryFields();
        if (orderDeliveryAddresString != undefined) {
            let orderDeliveryAddres = JSON.parse(
                localStorage.getItem("delivery_addres")
            );
            fillDeliveryFields(orderDeliveryAddres);
        }
    } else {
        deliveryInfo.style.display = "none";
        disableDeliveryFields();
    }
}

function setRequiredDeliveryFields() {
    for (let elem of orderTypeForm) {
        if (elem.type == "text" || elem.type == "number") {
            elem.classList.required = true;
        }
    }
}

function fillDeliveryFields(orderDeliveryAddres) {
    for (let elem of orderTypeForm) {
        if (elem.type == "text" || elem.type == "number") {
            elem.value = orderDeliveryAddres[elem.name];
            elem.classList.add("active");
        }
    }
}

function disableDeliveryFields() {
    for (let elem of orderTypeForm) {
        if (elem.type == "text" || elem.type == "number") {
            elem.classList.required = false;
            elem.classList.remove("active");
        }
    }
}

function placeOrder(event) {
    let elem = event.target;
    event.preventDefault();

    toggleSubmitSpinner(orderTypeForm);

    let items_list = [];
    for (let key of Object.keys(cartData)) {
        items_list.push({ item_id: key, qty: cartData[key].qty });
        // for (let i = 0; i < cartData[key].qty; i++) {
        //     items_list.push(key);
        // }
    }

    let order_type = orderTypeForm.orderTypeRadio.value;
    let deliveryCity = orderTypeForm.deliveryCity.value;
    let deliveryStreet = orderTypeForm.deliveryStreet.value;
    let deliveryHouse = orderTypeForm.deliveryHouse.value;
    let deliveryApartment = orderTypeForm.deliveryApartment.value;
    let deliveryRemember = orderTypeForm.deliveryRemember.checked;

    let orderDeliveryAddres = {
        city: deliveryCity,
        street: deliveryStreet,
        house: deliveryHouse,
        apartment: deliveryApartment,
    };

    let order_data = {
        items_list: items_list,
        order_type: order_type,
    };
    if (order_type == "delivery") {
        if (!(deliveryCity && deliveryStreet && deliveryHouse)) {
            showAlert({
                message: "Необходимо заполнить адрес доставки",
                type: "danger",
            });
            toggleSubmitSpinner(orderTypeForm);
            return;
        }
        order_data["delivery_addres"] = orderDeliveryAddres;
        if (deliveryRemember) {
            localStorage.setItem(
                "delivery_addres",
                JSON.stringify(orderDeliveryAddres)
            );
        } else {
            localStorage.removeItem("delivery_addres");
        }
    }

    document.querySelector("#placeOrderButton").disabled = true;
    if (items_list.length > 0) {
        axios
            .post("/api/order/create", order_data)
            .then(function (response) {
                toggleSubmitSpinner(orderTypeForm);
                orderTypeForm.reset();
                clearCart();

                // console.log("then ", response.data);
                if (response.data.status == "success") {
                    showAlert({
                        message: "Заказ успешно создан",
                        type: "success",
                    });
                    setTimeout(() => {
                        window.location.href =
                            response.data.data.confirmation.confirmation_url;
                    }, 500);
                } else {
                    showAlert({
                        message: response.data.message,
                        type: "danger",
                    });
                }
            })
            .catch(function (error) {
                toggleSubmitSpinner(orderTypeForm);
                showAlert({
                    message: error.response.data.message,
                    type: "danger",
                });
            });
    }
}

function renderCartItem(data) {
    let item_id = data.item_id;
    let img_url = data.img_urls[0];
    let item_name = data.item_name;

    const getControls = (item_id) => {
        return `
        <div class="card-btn d-flex pb-1 justify-content-end align-items-end" style="height: 100%;">
            <a href="#" class="mx-1" onclick="removeFromCart('${item_id}', false)"><i class="fas fa-minus"></i></a>
            <span class="mx-2" id="item_qty_${item_id}"></span>
            <a href="#" class="mx-1" onclick="addToCart('${item_id}')"><i class="fas fa-plus"></i></a>
            <span class="ms-2" id="item_price_${item_id}"></span>
            <span class="ms-1">руб.</span>
        </div>`;
    };
    const getCartItemBase = (item_id, img_url, item_name) => {
        return `
        <div class="remove-icon">
            <a href="#" class="mx-1" onclick="removeFromCart('${item_id}', true)"><i class="fas fa-times"></i></a>
        </div>
        <div class="d-flex justify-content-between" style="height: 150px;">
            <div class="d-flex">
                <img src="${img_url}" class="img-fluid cart-img" loading="lazy">
            </div>
            <div class="d-flex flex-column flex-fill p-3">
                <div class="d-flex justify-content-between flex-column align-items-start">
                    <h5 class="card-title">${item_name}</h5>
                </div>
                ${getControls(item_id)}
            </div>
        </div>
    `;
    };

    const cartContainer = document.querySelector("#cartContainer");
    let div = document.createElement("div");
    div.classList.add("cart-body");
    div.classList.add("container");
    div.id = `cart_item_${item_id}`;
    div.innerHTML = getCartItemBase(item_id, img_url, item_name);
    cartContainer.appendChild(div);
}

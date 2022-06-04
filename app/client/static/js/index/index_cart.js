"use strict";

let totalQty = 0;
let totalPrice = 0;
let empty_cart = false;
let cart_state_changed_evt = new Event("cart_state_changed");

const cartContainerWrapper = document.querySelector("#cartContainerWrapper");
const cartWarning = document.querySelector("#cartWarning");

const orderTypeForm = document.querySelector("#orderTypeForm");
orderTypeForm.addEventListener("submit", placeOrder);

const deliveryInfo = document.querySelector("#deliveryInfo");

const spinner = document.querySelector(".spinner-border");

function updateMenuItemButton(item_id, message) {
    let selector = `[data-item-id='${item_id}']`;
    document.querySelectorAll(selector).forEach((elem) => {
        if (elem.innerHTML.trim() != `<i class="fas fa-plus"></i>`) {
            elem.innerHTML = message;
        }
    });
}

function addToCart(elem) {
    let item_id = elem.dataset.itemId;
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
    localStorage.setItem("user_cart", JSON.stringify(cartData));
    recountCart();
}

function removeFromCart(item_id, remove = false, recount = true) {
    let cartData = JSON.parse(localStorage.getItem("user_cart"));
    if (!cartData) {
        return;
    }
    let cart_item = cartData[item_id];
    if (cart_item) {
        if (cartData[item_id].qty == 1 || remove) {
            delete cartData[item_id];
            document.querySelector(`#cart_item_${item_id}`).outerHTML = "";
            updateMenuItemButton(item_id, "В корзину");
        } else {
            cartData[item_id].qty--;
        }
    } else {
        return;
    }
    localStorage.setItem("user_cart", JSON.stringify(cartData));
    if (recount) {
        recountCart();
    }
}

function clearCart() {
    let cartDataString = localStorage.getItem("user_cart");
    if (cartDataString) {
        cartData = JSON.parse(cartDataString);
        totalQty = 0;
        totalPrice = 0;
        for (let key of Object.keys(cartData)) {
            removeFromCart(key, true, false);
        }
        recountCart();
    }
}

function showNoteEmptyCart() {
    switchElem(document.querySelector("#cartContainerWrapper"), "off");
    switchElem(document.querySelector("#cartWarning"), "on");
    empty_cart = true;
    document.dispatchEvent(cart_state_changed_evt);
}

function hideNoteEmptyCart() {
    switchElem(document.querySelector("#cartContainerWrapper"), "on");
    switchElem(document.querySelector("#cartWarning"), "off");
    empty_cart = false;
    document.dispatchEvent(cart_state_changed_evt);
}

function updateCartQtyBadge(totalQty) {
    document.querySelectorAll(".cartTotalQty").forEach((elem) => {
        elem.innerHTML = totalQty > 0 ? totalQty : "";
    });
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
        updateCartQtyBadge(0);
        return;
    }
    totalQty = 0;
    totalPrice = 0;
    for (let key of Object.keys(cartData)) {
        updateMenuItemButton(key, "В корзине");
        let one_item_price = cartData[key].price;
        let items_price = cartData[key].qty * one_item_price;
        let items_qty = cartData[key].qty;

        totalQty += items_qty;
        totalPrice += items_price;
        if (!document.querySelector(`#cart_item_${key}`)) {
            renderCartItem(cartData[key]);
        }
        document.querySelector(`#item_qty_${key}`).innerHTML = items_qty;
    }
    updateCartQtyBadge(totalQty);
    document.querySelector("#cartTotal").innerHTML = `${totalPrice.toFixed(
        2
    )}&nbsp;₽`;
    hideNoteEmptyCart();
}

function changeOrderForm() {
    let radio = orderTypeForm.orderTypeRadio.value;
    let orderDeliveryAddresString = localStorage.getItem("delivery_addres");

    if (radio == "delivery") {
        switchElem(deliveryInfo, "on");
        setRequiredDeliveryFields();
        if (orderDeliveryAddresString != undefined) {
            let orderDeliveryAddres = JSON.parse(
                localStorage.getItem("delivery_addres")
            );
            fillDeliveryFields(orderDeliveryAddres);
        }
    } else {
        switchElem(deliveryInfo, "off");
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

    toggleSubmitSpinner(elem);

    let items_list = [];
    for (let key of Object.keys(cartData)) {
        items_list.push({ item_id: key, qty: cartData[key].qty });
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

                // print("then ", response.data);
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
                print("catch ", error);
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
    let item_price = data.price;

    const getCartItemBase = (item_id, img_url, item_name, item_price) => {
        return `
        <!-- Single Cart Item -->
        <a href="#" class="product-image">
            <img
                src="${img_url}"
                class="cart-thumb"
                alt=""
            />
            <!-- Cart Item Desc -->
            <div class="cart-item-desc">
                <span
                    class="product-remove"
                    onclick="removeFromCart('${item_id}', true)"
                    ><i class="fa fa-close" aria-hidden="true"></i
                ></span>
                <h6 onclick="renderMenuItemModal('${item_id}')">${item_name}</h6>
                <div class="d-flex flex-wrap justify-content-between">
                    <div class="col-12 col-md-5 col-lg-5">
                        <p class="price">${item_price.toFixed(2)}&nbsp;₽</p>
                    </div>
                    <div class="col-12 col-md-5 col-lg-5">
                        <div class="d-flex justify-content-between">
                            <p
                                class="price"
                                onclick="removeFromCart('${item_id}', false)"
                            >
                                <i class="fas fa-minus"></i>
                            </p>
                            <p class="price mx-2" id="item_qty_${item_id}"></p>
                            <p
                                class="price"
                                data-item-id=${item_id}
                                onclick="addToCart(this)"
                            >
                                <i class="fas fa-plus"></i>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </a>`;
    };

    const cartContainer = document.querySelector("#cartContainer");
    let div = document.createElement("div");
    div.classList.add("single-cart-item");
    div.classList.add("mb-2");
    div.id = `cart_item_${item_id}`;
    div.innerHTML = getCartItemBase(item_id, img_url, item_name, item_price);
    cartContainer.appendChild(div);
}

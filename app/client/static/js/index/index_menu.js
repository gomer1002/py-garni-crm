"use strict";

function getMenuProductImage(img_urls) {
    return `
    <div class="product-img">
        <img
            src="${img_urls[0]}"
            alt=""
        />
        ${
            img_urls.length > 1
                ? `
        <!-- Hover Thumb -->
        <img
            class="hover-img"
            src="${img_urls[1]}"
            alt=""
        />`
                : ""
        }
    </div>`;
}

function renderMenuItem(data) {
    let item_id = data.item_id;
    let img_urls = data.img_urls;
    let item_name = data.item_name;
    let available_to_order = data.available_to_order;
    let price = data.price;

    let func = available_to_order
        ? `addToCart(this)`
        : `showAlert({message:"Данный товар невозможно заказать!", "info")`;
    let menuItemBase = `
        <div class="single-product-wrapper">
            <!-- Product Image -->
            ${getMenuProductImage(img_urls)}
            
            <!-- Product Description -->
            <div class="product-description">
                <h6 onclick="renderMenuItemModal('${item_id}')" style="cursor:pointer;">${item_name}</h6>
                <p class="product-price">
                    ${price} ₽
                </p>

                <!-- Hover Content -->
                <div class="hover-content">
                    <!-- Add to Cart -->
                    <div class="add-to-cart-btn">
                        <button
                            type="button"
                            data-item-id="${item_id}"
                            onclick="${func}"
                            class="btn essence-btn"
                            >В корзину</button
                        >
                    </div>
                </div>
            </div>
        </div>`;
    return menuItemBase;
}

function comparator(a, b) {
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    return 0;
}

function getCategoryWrapper(category) {
    let wrapper = document.createElement("div");
    wrapper.classList = "row category-wrapper";
    wrapper.innerHTML = `
        <div class="category-header">
            <p class="category-anchor" id="${category}"></p>
            <h2>${category}</h2>
        </div>`;
    return wrapper;
}

function renderMenuList(menu_data) {
    const menuContainer = document.querySelector("#menuContainer");
    let sorted_data = Object.values(menu_data).sort(comparator);
    let prev_category = "";
    let wrapper = null;
    for (let item_key in sorted_data) {
        if (sorted_data[item_key].show) {
            let category = sorted_data[item_key].category;
            let div = document.createElement("div");
            div.classList = "col-12 col-sm-6 col-lg-4 item-wrapper";
            div.dataset.sortName = sorted_data[item_key].item_name;
            div.dataset.sortTags = sorted_data[item_key].tags;
            div.dataset.sortPrice = sorted_data[item_key].price;
            div.innerHTML = renderMenuItem(sorted_data[item_key]);

            if (category != prev_category) {
                wrapper = getCategoryWrapper(category);
                menuContainer.appendChild(wrapper);
                prev_category = category;
            }
            wrapper.appendChild(div);
        }
    }
}

function renderSingleMenuItem(item_data, clear) {
    if (clear) {
        return "";
    }
    let item_id = item_data.item_id;
    let img_urls = item_data.img_urls;
    let item_name = item_data.item_name;
    let item_description = item_data.item_description;
    let item_weight = item_data.portion_weight;
    let item_calories = item_data.portion_calories;
    let available_to_order = item_data.available_to_order;
    let price = item_data.price;

    let func = available_to_order
        ? `addToCart(this)`
        : `showAlert({message:"Данный товар невозможно заказать!", "info")`;
    let menuItemBase = `
    <section class="single_product_details_area ">
        <!-- Product Image -->
        ${getMenuProductImage(img_urls)}
        
        <!-- Product Description -->
        <div class="single_product_desc clearfix">
            <h4>${item_name}</h4>
            <p class="product-price">
                ${price}&nbsp;₽
            </p>
            <p class="product-desc">
                ${item_weight}&nbsp;г.
            </p>
            <p class="product-desc">
                ${item_description}
            </p>
            <p class="product-desc">
                Энергетическая ценность за порцию: ${item_calories}&nbsp;кКал.
            </p>
        </div>
        <div class="d-flex flex-fill justify-content-center pb-3">
            <!-- Cart -->
            <button
                type="button"
                data-item-id="${item_id}"
                onclick="${func}"
                class="btn essence-btn"
                >В корзину</button
            >
        </div>
    </section>`;
    return menuItemBase;
}

function renderMenuItemModal(item_id, clear = false) {
    let item_data = menuData[item_id];
    menuItemContainerWrapper.innerHTML = renderSingleMenuItem(item_data, clear);
    if (!clear) {
        addClass(menuItemOverlay, menuItemOverlayOn);
        addClass(menuItemWrapper, menuItemOn);
    }
    document.dispatchEvent(cart_state_changed_evt);
}

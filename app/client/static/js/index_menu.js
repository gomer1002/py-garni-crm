"use strict";

function renderMenuItem(data) {
    let item_id = data.item_id;
    let img_urls = data.img_urls;
    let item_name = data.item_name;
    let item_description = data.item_description;
    let available_to_order = data.available_to_order;
    let price = data.price;

    const getCarousel = (item_id, img_urls) => {
        let menuCarouselButtons = ``;
        if (img_urls.length > 1) {
            menuCarouselButtons = getMenuCarouselButtons(item_id);
        }
        return `
        <div id="item_${item_id}" class="card-carousel carousel slide" data-mdb-ride="carousel">
            <div class="carousel-inner">
                ${getMenuCarouselImages(img_urls)}
            </div>
            ${menuCarouselButtons}
        </div>`;
    };
    const getMenuCarouselImages = (img_urls) => {
        let ans = ``;
        let first = true;
        for (let img_url of img_urls) {
            ans += `
            <div class="carousel-item ${first ? "active" : ""}">
                <img src="${img_url}" class="card-img-top" loading="lazy" />
            </div>`;
            first = false;
        }
        return ans;
    };
    const getMenuCarouselButtons = (item_id) => {
        return `
    <button class="carousel-control carousel-control-prev d-flex align-items-end pb-2" type="button" data-mdb-target="#item_${item_id}" data-mdb-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control carousel-control-next  d-flex align-items-end pb-2" type="button" data-mdb-target="#item_${item_id}" data-mdb-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
    </button>`;
    };
    const getMenuItemBase = (
        item_id,
        img_urls,
        item_name,
        price,
        available_to_order,
        item_description
    ) => {
        let func;
        if (available_to_order) {
            func = `addToCart('${item_id}')`;
        } else {
            func = `showAlert({message:"Данный товар невозможно заказать!", "info")`;
        }
        return `
        <div class="card-body container p-0 card">
            ${getCarousel(item_id, img_urls)}
            <div class="card-info d-flex justify-content-between flex-column align-items-start p-2">
                <div class="flex-fill">
                    <h5 class="card-title">${item_name}</h5>
                </div>
                <div class="card-btn d-flex pb-1 justify-content-between align-items-center dropdown" style="/*height: 100%;*/">
                    <i 
                        class="fas fa-info-circle m-2" 
                        data-mdb-toggle="dropdown"
                        aria-expanded="false"
                        data-mdb-auto-close="outside" 
                        style="cursor: pointer;"
                        onmouseenter="new mdb.Dropdown(this).show()"
                        onmouseleave="new mdb.Dropdown(this).hide()"
                    ></i>
                    <div class="dropdown-menu p-2">
                        ${item_description}
                    </div>
                    <button type="button" class="btn btn-outline-dark btn-rounded" data-mdb-ripple-color="dark" onclick="${func}" ${
            available_to_order ? "" : "disabled"
        }>${price}<i class="fas fa-cart-plus ps-2"></i></button>
                </div>
            </div>
        </div>`;
    };
    return getMenuItemBase(
        item_id,
        img_urls,
        item_name,
        price,
        available_to_order,
        item_description
    );
}

function renderMenuList(menu_data) {
    const menuContainer = document.querySelector("#menuContainer");
    for (let item_key in menu_data) {
        if (menu_data[item_key].show) {
            let div = document.createElement("div");
            div.classList.add("card-container");
            div.classList.add("mt-3");
            div.classList.add("px-2");
            div.dataset.sortName = menu_data[item_key].item_name;
            div.dataset.sortTags = menu_data[item_key].tags;
            div.dataset.sortPrice = menu_data[item_key].price;
            div.innerHTML = renderMenuItem(menu_data[item_key]);
            menuContainer.appendChild(div);
        }
    }
}

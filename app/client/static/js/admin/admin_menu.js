"use strict";

let image_placeholder_url = "/client/static/img/food-placeholder.png";
// let image_placeholder_url = "https://storage.googleapis.com/py-garni-crm.appspot.com/food-placeholder.png";

let menuData;
let storageData;
let tagsData;
let categoriesData;
let imagesData;
let menuFilesUploadForm;
let editMenuItemModal;
let editMenuItemModalMdb;

let editMenuItemModalForm;

let menuImageGaleryModal;
let menuImageGaleryModalMdb;

let confirmModal;
let confirmModalMdb;

function getFileNameFromURL(url) {
    let name = url.replace(
        url.slice(0, url.indexOf("appspot.com/")) + "appspot.com/",
        ""
    );
    return name;
}

function getGalleryElem(img_urls) {
    let div = document.createElement("div");
    div.classList =
        "d-flex justify-content-start align-items-center flex-row flex-wrap item-galery mb-4";
    div.innerHTML = getGalleryElemInnerHtml(img_urls);
    return div;
}

function getGalleryInnerImg(url, selection = false) {
    return `
    <div
        class="galery-img m-1"
    >
        <div class="img-controls">
            ${
                selection
                    ? `
                    <i
                        class="far fa-lg fa-check-circle img-select"
                        onclick="addClass(this.parentNode, 'selected')"
                    ></i>
                    <i
                        class="fas fa-lg fa-check-circle img-selected"
                        onclick="removeClass(this.parentNode, 'selected')"
                    ></i>
                    <div class="d-flex flex-fill justify-content-end">
                        <i
                            class="far fa-lg fa-trash-alt"
                            onclick="confirmDeletion(this)"
                        ></i>
                    </div>
                    `
                    : `
                    <div class="d-flex flex-fill justify-content-end">
                        <i
                            class="fas fa-lg fa-times"
                            onclick="destroyImg(this)"
                        ></i>
                    </div>
                    `
            }
        </div>
        <img
            onclick="toggleClass(this.closest('.galery-img'), 'zoom')"
            class="img-fluid"
            src="${url}"
        />
        <p>${getFileNameFromURL(url)}</p>
    </div>`;
}

function getGalleryElemInnerHtml(img_urls, selection = false) {
    let img_html = "";
    for (let url of img_urls) {
        img_html += getGalleryInnerImg(url, selection);
    }
    if (!selection) {
        img_html += `
        <div
            class="galery-img m-1 img-placeholder"
            onclick="toggleImgGaleryModal(this)"
        >
            <i class="fas fa-plus fa-4x"></i>
        </div>`;
    }
    return img_html;
}

function getTagsElem(item_tags) {
    let tags_html = "";
    for (let tag of item_tags) {
        tags_html += `
        <div class="tag-outline">
            <input
                class="form-control tag-input"
                type="text"
                list="menuTagList"
                onfocusout="submitTag(this)"
                name="${tag}"
                value="${tag}"
            />
            <i
                class="far fa-minus-square tag-trailing"
                onclick="destroyTag(this)"
            ></i>
        </div>
        `;
    }
    return `
    <!-- Tags input -->
    <a
        href="#"
        class="text-dark form-control dropdown-toggle"
        type="button"
        data-mdb-toggle="dropdown"
        aria-expanded="false"
        data-mdb-auto-close="outside"
        >
            <span class="me-1 fs-6 fw-light">Теги</span>
            <i
                class="fas fa-lg fa-list-ul tag-dropdown-toggle"
            ></i
    ></a>
    <div
        class="dropdown-menu p-2"
        style="width: 200px"
    >
        ${tags_html}
        <div class="tag-outline">
            <input
                class="form-control tag-input"
                style="padding: 0 0 0 4px"
                list="menuTagList"
                type="text"
                onfocusout="createTag(event)"
                onkeydown="createTag(event)"
                name=""
            />
        </div>
    </div>`;
}

function menuFilesUploadFormEventListener(event) {
    event.preventDefault();
    let btn = event.target;

    let menuFilesUploadForm = document.querySelector("#menuFilesUploadForm");
    let formData = new FormData(menuFilesUploadForm);

    toggleSubmitSpinner(btn);
    axios
        .post("/api/image/upload", formData)
        .then(function (response) {
            showAlert({ message: response.data.message, type: "success" });
            for (let url of response.data.data) {
                imagesData.push(url);
            }
            renderGaleryModal();
            toggleSubmitSpinner(btn);
            // console.log(response.data.message);
        })
        .catch(function (error) {
            showAlert({ message: error.response.data.message, type: "danger" });
            toggleSubmitSpinner(btn);
            // console.log(error);
        });
}

function processSelectedImages() {
    let images = menuImageGaleryModal.querySelectorAll(".selected");
    let item_id = menuImageGaleryModal.dataset.targetId;
    item_id = item_id == "" ? null : item_id;
    // let image_urls = [];
    for (let elem of images) {
        removeClass(elem, "selected");
        let url = elem.parentNode.querySelector("img").src;
        if (menuData[item_id].img_urls.indexOf(url) == -1) {
            menuData[item_id].img_urls.push(url);
        }
    }
    // console.log(image_urls);
    menuImageGaleryModalMdb.hide();

    let modal_body = editMenuItemModal.querySelector(".modal-body");
    let modal_form = modal_body.querySelector("form");

    //создание галереи изображений позиции
    modal_form.querySelector(".item-galery").innerHTML =
        getGalleryElemInnerHtml(menuData[item_id].img_urls);
}

function renderGaleryModal() {
    let modal_item_gallery = menuImageGaleryModal.querySelector(".item-galery");
    modal_item_gallery.innerHTML = getGalleryElemInnerHtml(imagesData, true);
}

function renderModal(elem, new_item = false) {
    let item_form = elem.closest("form");
    let item_id = null;
    let menu_item;

    if (!new_item) {
        item_id = item_form.item_id.value;
        menu_item = menuData[item_id];
    } else {
        menuData[item_id] = { img_urls: [] };
    }

    let img_urls = new_item ? [image_placeholder_url] : menu_item.img_urls;
    let item_name = new_item ? "" : menu_item.item_name;
    let item_category = new_item ? "" : menu_item.category;
    let item_price = new_item ? "1" : menu_item.price;
    let item_tags = new_item ? [] : menu_item.tags;
    let composition = new_item ? [] : menu_item.composition;
    let item_description = new_item ? "" : menu_item.item_description;
    let portion_weight = new_item ? "" : menu_item.portion_weight;
    let portion_calories = new_item ? "" : menu_item.portion_calories;
    let item_available = new_item ? false : menu_item.available_to_order;
    let item_show = new_item ? false : menu_item.show;

    let modal_body = editMenuItemModal.querySelector(".modal-body");

    let modal_form = modal_body.querySelector("form");

    //заполнение форм редактирования
    //запись идентификатора товара
    modal_form.item_id.value = item_id;

    //заполнение галереи картинок товара
    modal_form.querySelector(".item-galery").innerHTML =
        getGalleryElemInnerHtml(img_urls);

    //запись нименования товара
    modal_form.name_input.value = item_name;

    //запись стоимости товара
    modal_form.price_input.value = item_price;

    //заполнение списка тегов
    modal_form.querySelector(".dropdown").innerHTML = getTagsElem(item_tags);

    //заполнение состава
    modal_form.querySelector(".composition-container").innerHTML =
        renderRecordList(composition);

    //запись описания товара
    modal_form.description_input.value = item_description;

    //запись категории товара
    modal_form.category_input.value = item_category;

    //запись веса товара
    modal_form.weight_input.value = portion_weight;

    //запись калорийности товара
    modal_form.calories_input.value = portion_calories;

    //установка флага доступности
    modal_form.available_input.checked = item_available ? true : false;

    //установка флага отображения
    modal_form.show_input.checked = item_show ? true : false;

    editMenuItemModalMdb.show();
}

function toggleImgGaleryModal(elem) {
    let item_id = elem.closest("form").item_id.value;
    menuImageGaleryModal.dataset.targetId = item_id;
    menuImageGaleryModalMdb.show();
}

function destroyImg(elem) {
    let item_galery = elem.closest(".item-galery");
    let placeholder_elem = item_galery.querySelector(".img-placeholder");
    let imgs = item_galery.querySelectorAll("img");
    if (imgs.length == 1) {
        placeholder_elem.insertAdjacentHTML(
            "beforebegin",
            getGalleryInnerImg(image_placeholder_url)
        );
        showAlert({
            message:
                "Позиция меню должна содержать не менее одного изображения",
            type: "warning",
        });
    }
    elem.closest(".galery-img").remove();
}

function confirmDeletion(elem) {
    confirmModalMdb.show();
    let image_name = getFileNameFromURL(
        elem.closest(".galery-img").querySelector("img").src
    );
    confirmModal.dataset["image_name"] = image_name;
}

function getMenuTagsList() {
    let tags = [];
    for (let k of Object.keys(menuData)) {
        let instance = menuData[k];
        if (instance.tags) {
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
        if (category) {
            if (categories.indexOf(category) == -1) {
                categories.push(category);
            }
        }
    }
    return categories.sort();
}

function getMenuTagsContainerInnerHTML(item_tags) {
    let getTagsList = (item_tags) => {
        let ans_list = ``;
        if (item_tags) {
            for (let tag of tagsData) {
                if (item_tags.indexOf(tag) != -1) {
                    ans_list += `<span class="tag-outline tag-pill">${tag}</span>`;
                }
            }
        }
        return ans_list;
    };
    return `
    <div class="dropdown">
        <a
            href="#"
            class="text-dark dropdown-toggle"
            type="button"
            data-mdb-toggle="dropdown"
            aria-expanded="false"
            data-mdb-auto-close="outside"
            ><i class="fas fa-lg fa-list-ul tag-dropdown-toggle"></i
        ></a>
        <div class="dropdown-menu p-2 tag-dropdown" style="width: 200px">
            ${getTagsList(item_tags)}
        </div>
    </div>
    `;
}

function getMenuImgContainer(item_id, img_urls) {
    const getMenuCarouselImages = (img_urls) => {
        let ans = ``;
        let first = true;
        for (let img_url of img_urls) {
            ans += `
            <div class="carousel-item ${first ? "active" : ""}">
                <img src="${img_url}" class="card-img-top menu-img" loading="lazy"/>
            </div>`;
            first = false;
        }
        return ans;
    };
    const getMenuCarouselButtons = (item_id) => {
        return `
        <button 
            class="carousel-control carousel-control-prev d-flex align-items-end pb-2" 
            type="button" 
            data-mdb-target="#item_${item_id}" 
            data-mdb-slide="prev"
        >
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
        </button>
        <button 
            class="carousel-control carousel-control-next d-flex align-items-end pb-2" 
            type="button" 
            data-mdb-target="#item_${item_id}" 
            data-mdb-slide="next"
        >
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
        </button>`;
    };
    const getCarousel = (item_id, img_urls) => {
        let menuCarouselButtons = ``;
        if (img_urls.length > 1) {
            menuCarouselButtons = getMenuCarouselButtons(item_id);
        }
        return `
        <div 
            id="item_${item_id}" 
            class="col-2 col-md-2 col-lg-2 img-container carousel slide" 
            data-mdb-ride="carousel"
        >
            <div class="carousel-inner">
                ${getMenuCarouselImages(img_urls)}
            </div>
            ${menuCarouselButtons}
        </div>`;
    };
    return getCarousel(item_id, img_urls);
}

function deleteGalleryImg(btn) {
    let image_name = confirmModal.dataset["image_name"];
    let delete_data = { image_name: image_name };
    toggleSubmitSpinner(btn);
    axios
        .post("/api/image/del", delete_data)
        .then(function (response) {
            toggleSubmitSpinner(btn);
            // console.log("then ", response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                confirmModalMdb.hide();
                const promise1 = new Promise((resolve) => {
                    resolve(getDataFrom("/api/image/get"));
                }).then((data) => {
                    imagesData = data;
                    renderGaleryModal();
                });
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            toggleSubmitSpinner(btn);
            showAlert({ message: error.response.data.message, type: "danger" });
            // console.log("catch ", error.response.data);
        });
}

function menuItemSaveChanges(event) {
    event.preventDefault();
    let item_id = editMenuItemModalForm.item_id.value;
    let item_name = editMenuItemModalForm.name_input.value;
    let item_price = editMenuItemModalForm.price_input.value.replace(",", ".");
    let item_description = editMenuItemModalForm.description_input.value;
    let item_available = editMenuItemModalForm.available_input.checked;
    let item_show = editMenuItemModalForm.show_input.checked;
    let portion_weight = editMenuItemModalForm.weight_input.value;
    let portion_calories = editMenuItemModalForm.calories_input.value;
    let category = editMenuItemModalForm.category_input.value;

    // заполняем список ингредиентов
    let composition_elems =
        editMenuItemModalForm.querySelectorAll(".ingredient-item");
    let composition = [];
    for (let elem of composition_elems) {
        composition.push({
            ingredient_id:
                elem.querySelector("select").selectedOptions[0].dataset
                    .optionId,
            amount: elem.querySelector("input").value,
        });
    }
    if (composition.length == 0) {
        showAlert({
            message: "Необходимо добавить минимум один ингредиент!",
            type: "warning",
        });
        return;
    }

    // заполняем список картинок
    let img_urls_elems = editMenuItemModalForm.querySelectorAll("img");
    let img_urls = [];
    for (let elem of img_urls_elems) {
        img_urls.push(elem.src);
    }
    if (img_urls.length == 0) {
        showAlert({
            message: "Необходимо добавить минимум одно изображение!",
            type: "warning",
        });
        return;
    }

    // заполняем список тегов
    let tags_list_elems = editMenuItemModalForm
        .querySelector(".dropdown")
        .querySelectorAll("input");
    let tags_list = [];
    for (let elem of tags_list_elems) {
        if (elem.value != "") {
            tags_list.push(elem.value);
        }
    }
    // if (tags_list.length == 0) {
    //     showAlert({
    //         message: "Необходимо добавить минимум один тэг!",
    //         type: "warning",
    //     });
    //     return;
    // }

    // собираем запрос в кучу
    let path = "/api/memu/update";
    let data = {
        available_to_order: item_available,
        img_urls: img_urls,
        composition: composition,
        portion_weight: portion_weight,
        portion_calories: portion_calories,
        item_description: item_description,
        item_id: item_id,
        item_name: item_name,
        price: item_price,
        show: item_show,
        tags: tags_list,
        category: category,
    };
    // print(data);
    // return;

    toggleSubmitSpinner(editMenuItemModalForm);
    axios
        .post(path, data)
        .then(function (response) {
            toggleSubmitSpinner(editMenuItemModalForm);
            // console.log("then ", response.data);
            if (response.data.status == "success") {
                showAlert({ message: response.data.message, type: "success" });
                editMenuItemModalForm.reset();
                editMenuItemModalMdb.hide();
                initMenuList();
            } else {
                showAlert({ message: response.data.message, type: "danger" });
            }
        })
        .catch(function (error) {
            toggleSubmitSpinner(editMenuItemModalForm);
            showAlert({ message: error.response.data.message, type: "danger" });
            // console.log("catch ", error);
            // console.log("catch ", error.response.data);
        });
}

function destroyMenuIngredientRecord(elem) {
    elem.closest(".ingredient-item").remove();
    // let form = elem.closest("form");
    // let submit_btn = form.querySelector("[data-submit-button]");
    // print(submit_btn);
    // let records = form.querySelector(".ingredient-item");
    // if (!records) {
    //     switchElem(submit_btn, "off");
    // }
}

function renderRecordList(composition) {
    let ans_html = `
    <!-- Header -->
    <div
        class="list-group-item ingredient-header p-2"
    >
        <span class="col-5">Наименование</span>
        <span class="col-3">Количество</span>
        <span class="col-2">Единицы</span>
        <div class="col-1">
            <button
                type="button"
                class="btn btn-link btn-sm px-2 ripple-surface-dark"
                data-ripple-color="dark"
                onclick="createMenuRecord(this)"
            >
                <i
                    class="far fa-lg fa-plus-square text-dark"
                ></i>
            </button>
        </div>
    </div>
    <!-- income record -->
    `;
    if (composition.length != 0) {
        for (let ingredient_data of composition) {
            let ingredient_id = ingredient_data.ingredient_id;
            let ingredient_amount = ingredient_data.amount;
            ans_html += getIngredientRecord(
                storageData[ingredient_id].ingredient_name,
                ingredient_amount,
                ingredient_id,
                true
            );
        }
    }
    return ans_html;
}

let getIngredientRecord = (
    ingredient_name = "",
    ingredient_amount = 0,
    ingredient_id = "",
    raw = false
) => {
    let div = document.createElement("div");
    div.classList = "list-group-item ingredient-item p-2";
    div.innerHTML = `
            <div class="col-5 name-container">
                <select class="ingredient-select" oninput="processMenuData(event)" required>
                    ${renderMenuSelectList(ingredient_id)}
                </select>
            </div>

            <!-- item amount -->
            <div class="col-3 amount-container">
                <input type="number" min="1" step="1" name="item_amount" value="${ingredient_amount}" class="form-control" required />
            </div>

            <!-- Item unit -->
            <div class="col-2 unit-container">
                gramm
            </div>

            <!-- Item controls -->
            <div class="col-1 controls-container">
                <button type="button" class="btn btn-link btn-sm px-2 " data-ripple-color="dark" onclick="destroyMenuIngredientRecord(this)">
                    <i class="far fa-lg fa-trash-alt text-dark"></i>
                </button>
            </div>`;
    if (raw) {
        return `<div class="${div.classList}">${div.innerHTML}</div>`;
    }
    return div;
};

function createMenuRecord(elem) {
    let form = elem.closest(".composition-container");
    let name_containers = form.querySelectorAll(".name-container");
    for (let each of name_containers) {
        if (each.querySelector("select").selectedOptions[0].value == "") {
            destroyMenuIngredientRecord(each);
        }
    }
    form.appendChild(getIngredientRecord());
    // let submit_btn = form.parentNode.querySelector("[data-submit-button]");
    // let records = form.querySelector(".ingredient-item");
    // if (records) {
    //     switchElem(submit_btn, "on");
    // }
}

function renderMenuSelectList(selected_ingredient_id = "") {
    let renderOption = (item_record, selected_ingredient_id) => {
        return `<option data-option-id="${item_record.ingredient_id}" value="${
            item_record.ingredient_name
        }" data-option-name="${item_record.ingredient_name}" ${
            selected_ingredient_id == item_record.ingredient_id
                ? "selected"
                : ""
        }>${item_record.ingredient_name}</option>`;
    };

    let option_list = `<option value=""/>`;
    //filling select element
    for (let ingredient_id of Object.keys(storageData)) {
        let option = renderOption(
            storageData[ingredient_id],
            selected_ingredient_id
        );
        option_list += option;
    }
    return option_list;
}

function processMenuData(event) {
    let elem = event.target;
    let container = elem.closest(".composition-container");
    let select_list = container.querySelectorAll("select");
    for (let each of select_list) {
        if (
            each.selectedOptions[0].dataset.optionId ==
                elem.selectedOptions[0].dataset.optionId &&
            each != elem
        ) {
            elem.value = "";
            showAlert({
                message: "Данный ингредиент уже добавлен!",
                type: "warning",
            });
        }
    }
    return;
}

function renderMenuList() {
    let getMenuListHeader = () => {
        return `
        <form
            class="list-group-item menu-header p-2"
        >
            <span class="col-2 dropdown">
                <i
                    class="far fa-lg fa-image"
                    ${dropdownControls}
                ></i>
                <span class="dropdown-menu p-2"
                    >Изображение блюда</span
                >
            </span>

            <span
                class="col-2"
                ${sortSettings({ by: "sortName", sel: "data-sort-name" })}
            >
                Наименование
                ${sortControls}
            </span>

            <span
                class="col-1"
                ${sortSettings({
                    by: "sortPrice",
                    sel: "data-sort-price",
                    num: true,
                })}
            >
                <i
                    class="far fa-lg fa-money-bill-alt"
                    ${dropdownControls}
                ></i>
                ${sortControls}
                <span class="dropdown-menu p-2">Стоимость</span>
            </span>

            <span
                class="col-2"
            >
                Описание
            </span>

            <span class="col-1 dropdown">
                <i
                    class="fas fa-lg fa-universal-access"
                    ${dropdownControls}
                ></i>
                <span class="dropdown-menu p-2"
                    >Список тэгов</span
                >
            </span>

            <span
                class="col-1"
                ${sortSettings({
                    by: "sortCategory",
                    sel: "data-sort-category",
                })}
            >
                Категория
                ${sortControls}
            </span>

            <span
                class="col-1 dropdown"
                ${sortSettings({
                    by: "sortUpdateDate",
                    sel: "data-sort-update-date",
                    num: true,
                    swap: true,
                })}
            >
                <i
                    class="far fa-lg fa-calendar"
                    ${dropdownControls}
                ></i>
                ${sortControls}
                <span class="dropdown-menu p-2"
                    >Дата обновления позиции</span
                >
            </span>

            <div
                class="col-1 d-flex justify-content-between"
            >
                <span 
                    class="col-6 dropdown" 
                    ${sortSettings({
                        by: "sortShow",
                        sel: "data-sort-show",
                    })}
                >
                    <i
                        class="far fa-lg fa-eye"
                        ${dropdownControls}
                    ></i>
                    ${sortControls}
                    <span class="dropdown-menu p-2"
                        >Будет ли позиция отображаться в меню</span
                    >
                </span>
                <span 
                    class="col-6 dropdown" 
                    ${sortSettings({
                        by: "sortAvailable",
                        sel: "data-sort-available",
                    })}
                >
                    <i
                        class="far fa-lg fa-check-circle"
                        ${dropdownControls}
                    ></i>
                    ${sortControls}
                    <span class="dropdown-menu p-2"
                        >Доступна ли позиция для заказа</span
                    >
                </span>
            </div>
            
            <div class="col-1">
                <button
                    type="button"
                    class="btn btn-link btn-sm px-2"
                    data-ripple-color="dark"
                    onclick="renderModal(this, true)"
                >
                    <i class="far fa-lg fa-plus-square text-dark"></i>
                </button>
                <button
                    type="button"
                    class="btn btn-link btn-sm px-2"
                    data-ripple-color="dark"
                    onclick="initMenuList()"
                >
                    <i class="fas fa-lg fa-redo text-dark"></i>
                </button>
            </div>
        </form>
        `;
    };
    let getmenuRecord = (data) => {
        let getRecordBody = (data) => {
            let date = new Date(data.updated_on_unix * 1000);
            return `
            <!-- Item id -->
            <input type="hidden" name="item_id" value="${data.item_id}">

            <!-- Item img -->
            ${getMenuImgContainer(data.item_id, data.img_urls)}
            
            <!-- Item name -->
            <div class="col-2 name-container">${data.item_name}</div>

            <!-- item price -->
            <div class="col-1 price-container">${data.price}</div>

            <!-- item description -->
            <div class="col-2 description-container">
                <p>
                    ${data.item_description}
                </p>
            </div>
            
            <!-- Item tags -->
            <div class="col-1 dropdown tags-container">
                ${getMenuTagsContainerInnerHTML(data.tags)}
            </div>

            <!-- Item category -->
            <div class="col-1 category-container">${data.category}</div>

            <!-- Item update date -->
            <div class="col-1 date-container">${date.toLocaleDateString(
                "ru-RU"
            )}</div>

            <!-- Item show available -->
            <div class="col-1 ">
                <!-- Item show -->
                <div class="col-6 show-container dropdown">
                    <div
                        class="d-flex"
                        ${dropdownControls}
                    >
                        <input
                            class="form-check-input"
                            type="checkbox"
                            value="item_show"
                            name="item_show"
                            disabled=""
                            ${data.show ? "checked" : ""}
                        />
                    </div>
                    ${
                        data.show
                            ? `
                    <span class="dropdown-menu p-2"
                        >Позиция будет отображаться в меню</span
                    >
                    `
                            : `
                    <span class="dropdown-menu p-2"
                        >Позиция не будет отображаться в меню</span
                    >
                    `
                    }
                </div>

                <!-- Item available -->
                <div class="col-6 available-container dropdown">
                    <div
                        class="d-flex"
                        ${dropdownControls}
                    >
                        <input
                            class="form-check-input"
                            type="checkbox"
                            value="item_available"
                            name="item_available"
                            disabled=""
                            ${data.available_to_order ? "checked" : ""}
                        />
                    </div>
                    ${
                        data.available_to_order
                            ? `
                    <span class="dropdown-menu p-2"
                        >Позиция доступна для заказа</span
                    >
                    `
                            : `
                    <span class="dropdown-menu p-2"
                        >Позиция недоступна для заказа</span
                    >
                    `
                    }
                </div>
            </div>

            <!-- Item controls -->
            <div class="col-1 controls-container">
                <button
                    type="button"
                    class="btn btn-link btn-sm px-2"
                    data-ripple-color="dark"
                    onclick="renderModal(this)"
                    
                >
                    <i class="far fa-lg fa-edit text-dark"></i>
                </button>
            </div>
        `;
        };

        let form = document.createElement("form");
        form.classList = ["list-group-item menu-item p-2"];
        form.dataset.sortName = data.item_name;
        form.dataset.sortPrice = data.price;
        form.dataset.sortCategory = data.category;
        form.dataset.sortShow = data.show ? 1 : 0;
        form.dataset.sortAvailable = data.available_to_order ? 1 : 0;
        form.dataset.sortUpdateDate = data.updated_on_unix;
        form.name = `menu_item_${data.item_id}`;
        form.innerHTML = getRecordBody(data);
        return form;
    };

    let menuList = document.querySelector("#menuList");
    menuList.innerHTML = getMenuListHeader();
    for (let k of Object.keys(menuData)) {
        let menuRecord = getmenuRecord(menuData[k]);
        menuList.appendChild(menuRecord);
    }

    // заполнение списка тегов
    let tag_list_elem = document.querySelector("#menuTagList");
    if (!tag_list_elem) {
        tag_list_elem = document.createElement("datalist");
        tag_list_elem.id = "menuTagList";
        menuList.appendChild(tag_list_elem);
    }
    tag_list_elem.innerHTML = "";
    for (let tag of tagsData) {
        tag_list_elem.innerHTML += `<option value="${tag}">`;
    }

    // заполнение списка категорий
    let category_list_elem = document.querySelector("#menuCategoryList");
    if (!category_list_elem) {
        category_list_elem = document.createElement("datalist");
        category_list_elem.id = "menuCategoryList";
        menuList.appendChild(category_list_elem);
    }
    category_list_elem.innerHTML = "";
    for (let category of categoriesData) {
        category_list_elem.innerHTML += `<option value="${category}">`;
    }
}

function destroyTag(elem) {
    elem.closest(".tag-outline").remove();
}

function createTag(event) {
    let elem = event.target;
    if (
        ((event.type == "keydown" && event.keyCode == 13) ||
            event.type == "focusout") &&
        elem.value != ""
    ) {
        let container = elem.closest(".dropdown-menu");
        let div = document.createElement("div");
        div.classList = "tag-outline";
        div.innerHTML = `
        <input class="form-control tag-input" list="menuTagList" type="text" name="${elem.value}" value="${elem.value}" onfocusout="submitTag(this)">
        <i class="far fa-minus-square tag-trailing" onclick="destroyTag(this)"></i>
        `;
        container.insertBefore(div, elem.closest(".tag-outline"));
        elem.value = "";
        submitTag(div);
    }
}

function submitTag(elem) {
    if (elem.value == "") {
        return destroyTag(elem);
    }
    let container = elem.closest(".dropdown-menu");
    let tags_list = [];
    for (let input of container.querySelectorAll("input")) {
        if (tags_list.indexOf(input.value) == -1) {
            tags_list.push(input.value);
            input.name = input.value;
        } else {
            destroyTag(input);
        }
    }
}

function initMenuList() {
    const promise1 = new Promise((resolve, reject) => {
        resolve(getDataFrom("/api/menu/get"));
    })
        .then((data) => {
            menuData = sortObject(data, menu_obj_comparator, "item_id");
            return getDataFrom("/api/storage/get");
        })
        .then((data) => {
            storageData = sortObject(
                data,
                storage_obj_comparator,
                "ingredient_id"
            );
            return getMenuTagsList();
        })
        .then((data) => {
            tagsData = data;
            return getMenuCategoriesList();
        })
        .then((data) => {
            categoriesData = data;
            renderMenuList();
            return getDataFrom("/api/image/get");
        })
        .then((data) => {
            imagesData = data;
            renderGaleryModal();
        })
        .catch((reason) => {
            console.log(reason);
        });
}

function initPage() {
    window.addEventListener(
        "keydown",
        function (e) {
            if (
                e.keyIdentifier == "U+000A" ||
                e.keyIdentifier == "Enter" ||
                e.code == "Enter" ||
                e.key == "Enter"
            ) {
                if (e.target.nodeName == "INPUT") {
                    e.preventDefault();
                    return false;
                }
            }
        },
        true
    );
    window.addEventListener("scroll", function () {
        if (window.scrollY > 0) {
            addClass(this.document.querySelector(".header_area"), "sticky");
            if (window.scrollY > 150) {
                renderScrollArrow();
            }
        } else {
            removeClass(this.document.querySelector(".header_area"), "sticky");
            renderScrollArrow(true);
        }
    });

    menuFilesUploadForm = document.querySelector("#menuFilesUploadForm");
    menuFilesUploadForm.addEventListener(
        "submit",
        menuFilesUploadFormEventListener
    );

    editMenuItemModal = document.querySelector("#editMenuItemModal");
    editMenuItemModalMdb = new mdb.Modal(editMenuItemModal);

    editMenuItemModalForm = editMenuItemModal.querySelector(
        "#editMenuItemModalForm"
    );
    editMenuItemModalForm.addEventListener("submit", menuItemSaveChanges);

    menuImageGaleryModal = document.querySelector("#menuImageGaleryModal");
    menuImageGaleryModalMdb = new mdb.Modal(menuImageGaleryModal);

    confirmModal = document.querySelector("#confirmModal");
    confirmModalMdb = new mdb.Modal(confirmModal);

    initMenuList();
    setUpAutoLogOut("/admin");
}

document.addEventListener("DOMContentLoaded", initPage);

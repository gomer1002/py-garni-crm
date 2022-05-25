"use strict";

let request_num = 0;

var print = function () {
    console.log.apply(console, arguments);
};

function hideModal(modalId) {
    mdb.Modal.getInstance(modalId).hide();
}

function showModal(modalId) {
    mdb.Modal.getInstance(modalId).show();
}

function toggleVisibility(elem) {
    if (elem.classList.contains("display-none")) {
        elem.classList.remove("display-none");
    } else {
        elem.classList.add("display-none");
    }
}

function switchVisibility(elem1, elem2) {
    toggleVisibility(elem1);
    toggleVisibility(elem2);
}

function toggleControls(elem, func = undefined) {
    let container = elem.closest(".controls-container");
    let form = elem.closest("form");
    let base_controls = container.querySelector(".base-controls");
    let edit_controls = container.querySelector(".edit-controls");

    switchVisibility(edit_controls, base_controls);

    if (func) {
        func(form);
    }
    // toggleForm(form);
}

function toggleSubmitSpinner(elem) {
    let btn;
    if (elem.dataset.submitButton) {
        btn = elem;
    } else {
        btn = elem.parentNode.querySelector("[data-submit-button]");
    }
    let btnText = btn.dataset.submitButton;
    if (!btn.dataset.submitWidth) {
        let submitWidth = btn.offsetWidth;
        btn.dataset.submitWidth = submitWidth;
    }
    btn.disabled = !btn.disabled;
    let data = {
        true: `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`,
        false: btnText,
    };
    if (btn.disabled) {
        btn.style.removeProperty("width");
    } else {
        btn.style.setProperty(
            "width",
            `${btn.dataset.submitWidth}px`,
            "important"
        );
    }
    btn.innerHTML = data[btn.disabled];
}

function showMessage(message, type) {
    let modal = document.querySelector("#messageModal");
    if (!modal) {
        let modal_container = document.createElement("div");
        modal_container.innerHTML = `
        <div class="modal fade" id="messageModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true" data-mdb-toggle="modal" data-mdb-target="#messageModal">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <div class="modal-body note d-flex justify-content-between">
                    </div>
                </div>
            </div>
        </div>`;
        document.querySelector("body").appendChild(modal_container);
        modal = document.querySelector("#messageModal");
        console.log(modal);
    } else {
        modal.querySelector(".note").classList.remove("note-danger");
        modal.querySelector(".note").classList.remove("note-success");
        modal.querySelector(".note").innerHTML = "";
    }
    modal.querySelector(".note").classList.add(`note-${type}`);
    modal.querySelector(".note").innerHTML = message;
    new mdb.Modal(modal).show();
}

function showAlert({
    message = "",
    type = "",
    custom_timeout = undefined,
    auto_dispose = true,
} = {}) {
    let getNum = () => {
        return Math.floor(90000 - Math.random() * 80000);
    };
    let container = document.querySelector("#alertContainer");
    if (!container) {
        let alert_container = document.createElement("div");
        alert_container.dataset.alertDelay = 2500;
        alert_container.classList = "alert-container";
        alert_container.id = "alertContainer";
        document.querySelector("body").appendChild(alert_container);
        container = alert_container;
    }
    let timeout = container.dataset.alertDelay;
    if (custom_timeout) {
        timeout = custom_timeout;
    }
    let span = document.createElement("span");
    let span_id = `alert_${getNum()}`;
    span.id = span_id;
    span.classList = `alert-message note note-${type} p-2 mb-2`;
    span.onclick = () => disposeAlert(span_id, parseInt(2));
    span.innerHTML = message;
    container.appendChild(span);

    createAlert(span_id);
    if (auto_dispose) {
        disposeAlert(span_id, parseInt(timeout));
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function createAlert(span_id) {
    delay(5).then(() => {
        document.querySelector(`#${span_id}`).classList.add("creating");
    });
}

function disposeAlert(span_id, timeout) {
    delay(timeout)
        .then(() => {
            document.querySelector(`#${span_id}`).classList.add("destroying");
        })
        .then(() => delay(500))
        .then(() => {
            document.querySelector(`#${span_id}`).remove();
        });
}

function getDataFrom(url) {
    /*
    endpoint urls:
    storage:            "/api/storage/get"
    menu:               "/api/menu/get"
    users:              "/api/user/get"
    users rights:       "/api/user/rights"
    orders:             "/api/order/get"
    orders params:      ?order_status=payed&light=True&sort_direction=asc
    */
    return new Promise((resolve) => {
        axios
            .get(url)
            .then(function (response) {
                request_num = 0;
                resolve(response.data.data);
            })
            .catch(function (error) {
                if (error.response.data.message) {
                    showAlert({
                        message: error.response.data.message,
                        type: "danger",
                    });
                } else if (error.response.status == 404) {
                    showAlert({ message: "Нет данных", type: "danger" });
                } else {
                    if (request_num < 3) {
                        delay(1000).then(() => {
                            return getDataFrom(url);
                        });
                        request_num += 1;
                    } else {
                        showAlert({
                            message:
                                "Не удается получить данные с удаленного сервера. Попробуйте позже.",
                            type: "danger",
                        });
                        console.log(error);
                    }
                }
            });
    });
}

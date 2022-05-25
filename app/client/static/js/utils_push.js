"use strict";

// const application_server_public_key = "BNbxGYNMhEIi9zrneh7mqV4oUanjLUK3m+mYZBc62frMKrEoMk88r3Lk596T0ck9xlT+aok0fO1KXBLV4+XqxYM=";
let pushButton;

let isSubscribed = false;
let swRegistration = null;

function urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function updateBtn() {
    if (Notification.permission === "denied") {
        // pushButton.textContent = "Push Messaging Blocked.";
        pushButton.disabled = true;
        updateSubscriptionOnServer(null);
        return;
    }

    if (isSubscribed) {
        // pushButton.textContent = "Disable Push Messaging";
        pushButton.checked = true;
    } else {
        // pushButton.textContent = "Enable Push Messaging";
        pushButton.checked = false;
    }

    pushButton.disabled = false;
}

function updateSubscriptionOnServer(subscription) {
    // const subscriptionJson = document.querySelector(".js-subscription-json");
    // const subscriptionDetails = document.querySelector(
    //     ".js-subscription-details"
    // );
    // console.log("SUBSCRIPTION", subscription);
    if (subscription) {
        axios
            .post("/api/push/subscribe/", subscription)
            .then(function (response) {
                // console.log("subscribe user: ", response.data);
            })
            .catch(function (response) {
                console.log("subscribe user: ", response);
            });
        // subscriptionJson.textContent = JSON.stringify(subscription);
        // subscriptionDetails.classList.remove("is-invisible");
    } else {
        // subscriptionDetails.classList.add("is-invisible");
        axios
            .get("/api/push/unsubscribe/")
            .then(function (response) {
                // console.log("UNsubscribe user: ", response.data);
            })
            .catch(function (response) {
                console.log("UNsubscribe user: ", response);
            });
    }
}

function subscribeUser() {
    const application_server_public_key = localStorage.getItem(
        "application_server_public_key"
    );
    const applicationServerKey = urlB64ToUint8Array(
        application_server_public_key
    );
    swRegistration.pushManager
        .subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
        })
        .then(function (subscription) {
            // console.log("User is subscribed.");

            updateSubscriptionOnServer(subscription);
            localStorage.setItem("sub_token", JSON.stringify(subscription));
            isSubscribed = true;

            updateBtn();
        })
        .catch(function (err) {
            console.log("Failed to subscribe the user: ", err);
            updateBtn();
        });
}

function unsubscribeUser() {
    swRegistration.pushManager
        .getSubscription()
        .then(function (subscription) {
            if (subscription) {
                return subscription.unsubscribe();
            }
        })
        .catch(function (error) {
            console.log("Error unsubscribing", error);
        })
        .then(function () {
            updateSubscriptionOnServer(null);

            // console.log("User is unsubscribed.");
            isSubscribed = false;

            updateBtn();
        });
}

function initializeUI() {
    pushButton = document.querySelector(".js-push-btn");
    pushButton.addEventListener("click", function () {
        pushButton.disabled = true;
        if (isSubscribed) {
            unsubscribeUser();
        } else {
            subscribeUser();
        }
    });

    // Set the initial subscription value
    swRegistration.pushManager.getSubscription().then(function (subscription) {
        isSubscribed = !(subscription === null);

        // updateSubscriptionOnServer(subscription);

        if (isSubscribed) {
            // console.log("User IS subscribed.");
        } else {
            // console.log("User is NOT subscribed.");
            subscribeUser();
        }

        updateBtn();
    });
}

function initPush() {
    pushButton = document.querySelector(".js-push-btn");
    getApplicationServerKey();
    if ("serviceWorker" in navigator && "PushManager" in window) {
        // console.log("Service Worker and Push is supported");

        navigator.serviceWorker
            .register("/client/static/js/push_user_sw.js")
            .then(function (swReg) {
                // console.log("Service Worker is registered", swReg);

                swRegistration = swReg;
                initializeUI();
            })
            .catch(function (error) {
                console.error("Service Worker Error", error);
            });
    } else {
        // console.warn("Push messaging is not supported");
        // pushButton.textContent = "Push Not Supported";
        pushButton.disabled = true;
    }
}

function push_message() {
    // console.log("sub_token", localStorage.getItem("sub_token"));
    let message = document.querySelector("#message").value;
    axios
        .post("/api/push/push_v1/", { message: message })
        .then(function (response) {
            // console.log("send push: ", response.data);
        })
        .catch(function (response) {
            console.log("send push: ", response);
        });
}

function getApplicationServerKey() {
    axios
        .get("/api/push/subscribe/")
        .then(function (response) {
            // console.log("public key: ", response.data);
            localStorage.setItem(
                "application_server_public_key",
                response.data.data.public_key
            );
        })
        .catch(function (response) {
            console.log("public key: ", response);
        });
}

// document.addEventListener("DOMContentLoaded", initPush);

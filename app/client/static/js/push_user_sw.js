"use strict";

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

self.addEventListener("push", function (event) {
    console.log("[Service Worker] Push Received.");
    let push_data = JSON.parse(event.data.text());
    console.log(`[Service Worker] Push had this data: "${push_data}"`);
    const title = "Garni-24";
    const options = {
        body: `"${push_data.message}"`,
        icon: "/develop/static/images/icon.png",
        badge: "/develop/static/images/badge.png",
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    console.log("[Service Worker] Notification click Received.");
    console.log("event: ", event);

    event.notification.close();

    // event.waitUntil(clients.openWindow("https://garni-24.ru/develop"));
});

self.addEventListener("pushsubscriptionchange", function (event) {
    console.log("[Service Worker]: 'pushsubscriptionchange' event fired.");
    const applicationServerPublicKey = localStorage.getItem(
        "applicationServerPublicKey"
    );
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    event.waitUntil(
        self.registration.pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
            })
            .then(function (newSubscription) {
                // TODO: Send to application server
                updateSubscriptionOnServer(newSubscription);
                console.log(
                    "[Service Worker] New subscription: ",
                    newSubscription
                );
            })
    );
});

'use strict'


function currentTime() {
    let date = new Date();
    document.querySelector("#navClock").innerHTML = date.toLocaleTimeString();
    let t = setTimeout(currentTime, 450);
}

function currentDate() {
    let date = new Date();
    document.querySelector("#navDate").innerHTML = date.toLocaleDateString();
    let t = setTimeout(currentTime, 100000000);
}

function initClosk() {
    currentTime();
    currentDate();
}

document.addEventListener("DOMContentLoaded", initClosk);
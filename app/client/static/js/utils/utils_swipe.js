document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchend", handleTouchEnd);

let xDown = null;
let yDown = null;
let swipe_dir = null; // left, right, up, down
let d_width = parseFloat(
    getComputedStyle(document.querySelector("body")).width
);

let swipe_len_k = 0.2;
let swipe_len = d_width * swipe_len_k;

function getTouches(evt) {
    if (evt.type == "touchstart") {
        return evt.touches;
    }

    if (evt.type == "touchend") {
        return evt.changedTouches;
    }
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
}

function handleTouchEnd(evt) {
    if (
        evt.path.indexOf(document.querySelector(".main-slider-container")) != -1
    ) {
        return;
    }
    const firstTouch = getTouches(evt)[0];

    let xUp = firstTouch.clientX;
    let yUp = firstTouch.clientY;
    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0 && xDiff > swipe_len) {
            if (modal_swipe.right) {
                modal_swipe.right.dispatchEvent(new Event("click"));
            }
            // essenceCartBtn.dispatchEvent(new Event("click"));
        }
        if (xDiff < 0 && -xDiff > swipe_len) {
            if (modal_swipe.left) {
                modal_swipe.left.dispatchEvent(new Event("click"));
            }
            // rightSideCart.dispatchEvent(new Event("click"));
        }
    } else {
        // y axis swipes
    }
}

"use strict";

function log_out_me(redirectTarget = "/") {
    const instance = axios.create({
        headers: { Authorization: getCookie("access_token_cookie") },
    });
    instance
        .post("/api/auth/logout")
        .then(function (response) {
            deleteCookie("access_token_cookie");
            if (redirectTarget) {
                window.location.href = redirectTarget;
            }
        })
        .catch(function (error) {
            deleteCookie("access_token_cookie");
            if (redirectTarget) {
                window.location.href = redirectTarget;
            }
            print(error.response.data);
        });
}

function setUpAutoLogOut(redirectTarget = "/") {
    let cookie = getCookie("access_token_cookie");
    if (cookie) {
        let jwt = parseJwt(cookie);
        let exp = jwt.exp;
        let estimated =
            new Date(exp).getTime() - new Date().getTime() / 1000 - 1;
        // print(`log out after ${estimated} seconds`);
        setTimeout(() => {
            log_out_me(redirectTarget);
        }, estimated * 1000);
    }
}

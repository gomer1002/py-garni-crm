from flask import Blueprint, request
from garni_app.api.push.services import subscribe_user, unsubscribe_user, send_web_push
from garni_app.garni_app import app
from garni_app.garni_app import logger
from garni_app.services import response

from flask_jwt_extended import jwt_required, get_jwt

push = Blueprint("push", __name__)

VAPID_PUBLIC_KEY = app.config.get("DER_BASE64_ENCODED_PUBLIC_KEY")


@push.route("/api/push/subscribe/", methods=["GET", "POST"])
@jwt_required()
def subscribe_user_push():
    """Отправка публичного ключа для push уведомлений и регистрация токенов.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    if request.method == "GET":
        return response(
            "success",
            "Данные успешно получены",
            200,
            data={"public_key": VAPID_PUBLIC_KEY},
        )

    user_id = claims.get("sub")
    if request.content_type == "application/json":
        subscription_token = request.get_json("subscription_token")
        if subscribe_user(subscription_token, user_id):
            return response("success", "Пользователь успешно подписан", 201)
        return response("failed", "Не удалось подписать пользователя", 503)
    return response("failed", "Необходимо передать json", 400)


@push.route("/api/push/unsubscribe/", methods=["GET"])
@jwt_required()
def unsubscribe_user_push():
    claims = get_jwt()
    user_id = claims.get("sub")
    if unsubscribe_user(user_id=user_id):
        return response("success", "Пользователь успешно отписан", 201)
    return response("failed", "Не удалось отписать пользователя", 503)


##############################################


@push.route("/api/push/push_v1/", methods=["POST"])
@jwt_required()
def push_v1():
    # message = "Push Test v1"
    # print("request.json", request.json)

    post_data = request.get_json()
    claims = get_jwt()
    try:
        user_id = claims.get("sub")
        push_data = {"message": post_data.get("message")}
        send_web_push(user_id=user_id, message_data=push_data)
        return response("success", "ok", 200)
    except Exception as e:
        logger.error(str(e))
        return response("failed", str(e), 500)

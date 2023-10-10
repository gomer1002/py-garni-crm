from garni_app.garni_app import app, jwt_redis_blocklist
from garni_app.models.user import User

from flask_jwt_extended import get_jwt

import re


def validate_request_data(post_data, register=False):
    """Проверка полученных данных"""
    name = post_data.get("name") if register else "True"
    phone = post_data.get("phone")
    password = post_data.get("password")
    return (
        isinstance(name, str)
        and isinstance(password, str)
        and isinstance(phone, str)
        and re.match(
            r"^(\+7|7|8)(\s+)?\(?[0-9]{3}\)?(\s+)?[0-9]{3}-?[0-9]{2}-?[0-9]{2}$",
            phone,
        )
    )


def register_user(post_data):
    """Регистрация пользователя с проверенными реквизитами"""
    user = User.get_by_phone(phone=post_data.get("phone"))
    if isinstance(user, type(None)):
        jwt_token = User(
            name=post_data.get("name"),
            phone=post_data.get("phone"),
            password=post_data.get("password"),
        ).save()
        return jwt_token
    return None


def auth_user(post_data):
    """Авторизация пользователя с проверенными реквизитами"""
    return User(
        phone=post_data.get("phone"), password=post_data.get("password")
    ).sign_in()


# def blacklist_jwt_token_redis(request_header):  # correct version of blacklist_jwt_token using redis
#     """Добавление jwt токена в черный список"""
#     if request_header:
#         jti = get_jwt()["jti"]
#         jwt_redis_blocklist.set(jti, "", ex=app.config.get("JWT_ACCESS_TOKEN_EXPIRES"))
#         return True
#     return False


def blacklist_jwt_token(request_header):
    """Добавление jwt токена в черный список"""
    if request_header:
        jti = get_jwt()["jti"]
        jwt_redis_blocklist.ttl(jti, "", app.config.get("JWT_ACCESS_TOKEN_EXPIRES"))
        return True
    return False

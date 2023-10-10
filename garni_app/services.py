import re
import secrets
import string
from datetime import datetime as dt
from garni_app.garni_app import app
from flask import make_response, jsonify


def generate_crypt_string(length=40):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for i in range(length))


def get_time(get_timestamp=False, from_timestamp=False, timestamp=None):
    if get_timestamp:
        return dt.now().timestamp()
    elif from_timestamp and timestamp:
        return dt.fromtimestamp(timestamp)
    else:
        return dt.now()


def response(
    status: str, message: str, status_code: int, data: dict | list | str = None
):
    """Вспомогательный метод для создания Http ответа.

    params:
        status : статус обработки запроса, строка. Варианты: failed \ success
        message : сообщение с результатами обработки запроса. На клиенте выводится напрямую, строка.
        status_code : HTTP код ответа, число.
        data : данные, передаваемые в ответе на запрос, словарь \ список \ строка. Необязательный параметр.
    """
    resp_data = {"status": status, "message": message}
    if isinstance(data, (dict, list, str)):
        resp_data["data"] = data
    return make_response(jsonify(resp_data)), status_code


def response_auth(
    status: str,
    message: str,
    status_code: int,
    jwt_token: str,
    data: dict | list | str = None,
):
    """Вспомогательный метод для создания Http ответа и отправки cookie"""
    resp_data = {"status": status, "message": message, "access_token": jwt_token}
    if isinstance(data, (dict, list, str)):
        resp_data["data"] = data
    response_auth = make_response(jsonify(resp_data))
    response_auth.set_cookie(
        "access_token_cookie",
        jwt_token,
        max_age=app.config.get("JWT_ACCESS_TOKEN_EXPIRES").total_seconds(),
    )
    return response_auth, status_code


def get_obj_from_dict(obj: dict) -> object:
    """Преобразование словаря в объект с аттрибутами.

    .raw - необработанное содержание словаря
    """

    class wrap:
        def __init__(self, obj: dict = None):
            self.raw = obj

        def __str__(self):
            return str(self.raw)

        def wrapper(self):
            obj = self.raw
            if isinstance(obj, dict):
                for key in list(obj):
                    k = ""
                    if isinstance(key, int):
                        k = "_" + str(key)
                    else:
                        k = (
                            "_" + key.replace("-", "_")
                            if re.match(
                                r"(\d)",
                                key[0],
                            )
                            else key.replace("-", "_")
                        )
                    if isinstance(obj[key], dict):
                        setattr(self, k, get_obj_from_dict(obj[key]))
                    elif isinstance(obj[key], list):
                        l = []
                        for each in obj[key]:
                            if isinstance(obj, dict):
                                l.append(get_obj_from_dict(each))
                            else:
                                l.append(each)
                        setattr(self, k, l)
                    else:
                        setattr(self, k, obj[key])
            elif isinstance(obj, str) or isinstance(obj, int):
                return obj
            return self

    return wrap(obj).wrapper()


def response_logout(status: str, message: str, status_code: int):
    """Вспомогательный метод для создания Http ответа и удаления cookie"""
    response_auth = response(status, message, status_code)[0]
    response_auth.set_cookie(
        "access_token_cookie",
        "",
        max_age=-1,
    )
    return response, status_code

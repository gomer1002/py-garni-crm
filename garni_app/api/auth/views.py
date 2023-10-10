from flask import Blueprint, request
from flask.views import MethodView
from garni_app.api.auth.services import (
    validate_request_data,
    register_user,
    auth_user,
    blacklist_jwt_token,
)
from garni_app.services import (
    response,
    response_auth,
)

from flask_jwt_extended import jwt_required

auth = Blueprint("auth", __name__)


class RegisterUser(MethodView):
    def post(self):
        """Регистрация пользователя, запись в БД и генерация jwt токена.
        :return: Json ответ с токеном или сообщение об ошибке
        """
        if request.content_type == "application/json":
            post_data = request.get_json()

            if validate_request_data(post_data=post_data, register=True):
                jwt_token = register_user(post_data)

                if jwt_token:
                    return response_auth(
                        "success", "Регистрация успешна", 200, jwt_token
                    )
                return response("failed", "Пользователь уже существует", 202)
            return response(
                "failed",
                "Неверные данные",
                202,
            )
        return response("failed", "Необходимо передать json", 202)


class LoginUser(MethodView):
    def post(self):
        """Авторизация пользователя, если реквизиты верны.
        :return: Json ответ с токеном или сообщение об ошибке
        """
        if request.content_type == "application/json":
            post_data = request.get_json()

            if validate_request_data(post_data):
                jwt_token = auth_user(post_data)
                if jwt_token:
                    return response_auth(
                        "success",
                        "Авторизация успешна",
                        200,
                        jwt_token,
                    )
                return response(
                    "failed", "Пользователь не существует или некорректный пароль", 401
                )
            return response(
                "failed",
                "Неверный формат данных",
                401,
            )
        return response("failed", "Необходимо передать json", 202)


class LogOutUser(MethodView):
    @jwt_required()
    def post(self):
        """Завершение сессии пользователя
        :return: Json ответ с результатом завершения
        """
        request_header = request.headers.get("Authorization", type=str)
        if blacklist_jwt_token(request_header):
            return response("success", "Завершение сессии успешно", 200)
        return response("failed", "Необходим заголовок Authorization", 403)


# Register classes as views
registration_view = RegisterUser.as_view("register")
login_view = LoginUser.as_view("login")
logout_view = LogOutUser.as_view("logout")

# Add rules for the api Endpoints
auth.add_url_rule("/api/auth/register", view_func=registration_view, methods=["POST"])
auth.add_url_rule("/api/auth/login", view_func=login_view, methods=["POST"])
auth.add_url_rule("/api/auth/logout", view_func=logout_view, methods=["POST"])

from flask import Blueprint, request
from garni_app.api.user.services import (
    validate_update_data,
)
from garni_app.api.auth.services import (
    register_user,
    validate_request_data,
)
from garni_app.services import response
from garni_app.models.right import Right
from garni_app.models.role import Role
from garni_app.models.user import User

from flask_jwt_extended import jwt_required, get_jwt

user = Blueprint("user", __name__)


@user.route("/api/user/get", methods=["GET"])
@jwt_required()
def get_user_list_view():
    """Получение списка пользователей.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.read_users in user_rights:
        user_id = request.values.get("user_id")
        data = {}
        if isinstance(user_id, str):
            data = User.get_by_id(user_id)
        else:
            data = User.get()
        if len(data) == 0:
            return response("failed", "Не удалось получить данные", 503)
        return response(
            "success",
            "Данные успешно получены",
            200,
            data=data,
        )
    return response("failed", "Доступ запрещен", 403)


@user.route("/api/user/rights", methods=["GET"])
@jwt_required()
def get_rights_list_view():
    """Получение списка прав.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.read_users in user_rights:
        data = Right.get_list()
        return response(
            "success",
            "Данные успешно получены",
            200,
            data=data,
        )
    return response("failed", "Доступ запрещен", 403)


@user.route("/api/user/update", methods=["POST"])
@jwt_required()
def update_existing_user_view():
    """Получение списка пользователей.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    logged_user_id = claims.get("sub")
    if Right.access_admin_panel in user_rights and Right.edit_users in user_rights:
        if request.content_type == "application/json":
            data = request.get_json()
            if validate_update_data(data):
                if data["user_id"] != logged_user_id:
                    User(
                        user_id=data["user_id"],
                        name=data["name"],
                        phone=data["phone"],
                        rights=data["rights"],
                    ).save()
                    return response(
                        "success", "Данные пользователя успешно обновлены", 200
                    )
                return response(
                    "failed", "Невозможно изменить данные этого пользователя", 400
                )
            return response("failed", "Ошибка в данных", 202)
        return response("failed", "Необходимо передать json", 400)
    return response("failed", "Доступ запрещен", 403)


@user.route("/api/user/set", methods=["POST"])
@jwt_required()
def set_new_user_view():
    """Получение списка пользователей.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.edit_users in user_rights:
        if request.content_type == "application/json":
            data = request.get_json()
            if validate_request_data(data, register=True):
                token = register_user(data)
                if token:
                    return response("success", "Пользователь успешно создан", 200)
                return response("failed", "Пользователь уже существует", 202)
            return response("failed", "Ошибка в данных", 202)
        return response("failed", "Необходимо передать json", 400)
    return response("failed", "Доступ запрещен", 403)


@user.route("/api/user/del", methods=["POST"])
@jwt_required()
def del_user_view():
    """Получение списка пользователей.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    logged_user_id = claims.get("sub")
    if Right.access_admin_panel in user_rights and Right.edit_users in user_rights:
        if request.content_type == "application/json":
            data = request.get_json()
            user_id_for_del = data.get("user_id")
            if isinstance(user_id_for_del, str):
                if user_id_for_del != logged_user_id:
                    if User.delete(user_id_for_del):
                        return response("success", "Пользователь успешно удален", 200)
                    return response("failed", "Не удалось удалить пользователя", 503)
                return response(
                    "failed", "Невозможно удалить данного пользователя", 400
                )
            return response("failed", "Необходимо передать user_id", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)

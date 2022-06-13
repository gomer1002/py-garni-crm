from flask import Blueprint, request
from app.api.storage.services import (
    set_storage_income,
    validate_get_data,
    validate_post_data_set,
    validate_post_data_update,
)
from app.services import response
from app.models.right import Right
from app.models.storage import Storage
from app.models.storage_movement import StorageMovement

from flask_jwt_extended import jwt_required, get_jwt

storage = Blueprint("storage", __name__)
storage_base_path = "/api/storage"
movement_base_path = "/api/movement"


@storage.route(f"{storage_base_path}/get", methods=["GET"])
@jwt_required()
def get_storage_items_list_view():
    """Получение списка продуктов на складе.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.read_storage in claims.get(
        "rights"
    ):
        ingredient_id = request.values.get("ingredient_id")
        data = Storage.get(ingredient_id)
        return response(
            "success",
            "Данные успешно получены",
            200,
            data=data,
        )
    return response("failed", "Доступ запрещен", 403)


@storage.route(f"{storage_base_path}/set", methods=["POST"])
@jwt_required()
def set_storage_items_list_view():
    """Регистрация прихода на склад.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.edit_storage in user_rights:
        if request.content_type == "application/json":
            post_data = request.get_json()
            if validate_post_data_set(post_data):
                result, ans = set_storage_income(post_data, claims.get("sub"))
                if result:
                    return response(
                        "success",
                        "Изменения внесены",
                        200,
                        data=ans,
                    )
                return response(
                    "failed",
                    "При обновлении данных возникла ошибка",
                    500,
                    data=ans,
                )
            return response("failed", "Неверные данные", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)


@storage.route(f"{storage_base_path}/update", methods=["POST"])
@jwt_required()
def update_storage_item_view():
    """Регистрация прихода на склад.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.edit_storage in user_rights:
        if request.content_type == "application/json":
            post_data = request.get_json()
            if validate_post_data_update(post_data):
                result = Storage(
                    ingredient_id=post_data.get("ingredient_id"),
                    ingredient_name=post_data.get("ingredient_name"),
                    min_amount=int(post_data.get("min_amount")),
                    unit=post_data.get("unit"),
                    tags=post_data.get("tags"),
                ).update()
                if result:
                    return response("success", "Изменения внесены", 200)
                return response("failed", "При обновлении данных возникла ошибка", 500)
            return response("failed", "Неверные данные", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)


@storage.route(f"{movement_base_path}/get", methods=["GET"])
@jwt_required()
def get_movement_items_list_view():
    """Получение списка записей об изменении склада.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.access_admin_panel in user_rights and Right.read_storage in user_rights:
        get_data = request.values.to_dict()
        validated_get_data = validate_get_data(get_data)
        if validated_get_data:
            data = StorageMovement.get(
                ingredient_id=validated_get_data.get("ingredient_id"),
                order_items_by=validated_get_data.get("order_by"),
                order_direction=validated_get_data.get("order_direction"),
                from_date=validated_get_data.get("from_date"),
                to_date=validated_get_data.get("to_date"),
                limit=validated_get_data.get("limit"),
            )
            if isinstance(data, type(None)):
                return response("failed", "Нет связи с удаленным сервером", 503)
            return data
        return response("failed", "Неверные данные", 400)
    return response("failed", "Доступ запрещен", 403)

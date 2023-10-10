from garni_app.models.order_status import OrderStatus
from flask import Blueprint, request
from garni_app.api.order.services import (
    confirm_order_service,
    create_new_order_service,
    validate_request_data,
    get_user_order_service,
    change_purshare_status,
    check_if_any_unpayed_orders_service,
    validate_get_data,
    delete_order_service,
)
from garni_app.services import response
from garni_app.models.right import Right

from flask_jwt_extended import jwt_required, get_jwt

order = Blueprint("order", __name__)


@order.route("/api/order/create", methods=["POST"])
@jwt_required()
def create_new_order_view():
    """Создание нового заказа.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.place_order in user_rights:
        if request.content_type == "application/json":
            post_data = request.get_json()
            if validate_request_data(post_data=post_data, create=True):
                if check_if_any_unpayed_orders_service(user_id=claims.get("sub")):
                    order_data = create_new_order_service(
                        post_data=post_data, user_id=claims.get("sub")
                    )
                    if isinstance(order_data, dict):
                        return response(
                            "success", "Заказ успешно создан", 200, data=order_data
                        )
                        # TODO отправка push о новом заказе всем пользователям
                        # с правами доступа работы с заказами
                    return response("failed", "Не удается создать заказ", 503)
                return response(
                    "failed",
                    "Для создания нового заказа сначала необходимо оплатить предыдущие заказы",
                    403,
                )
            return response("failed", "Неверные данные", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)


@order.route("/api/order/delete", methods=["GET"])
@jwt_required()
def delete_order_view():
    """Удаление существующего заказа.
    :return: Json ответ или сообщение об ошибке
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    if Right.place_order in user_rights:
        get_data = request.values.to_dict()
        order_id = get_data.get("order_id")
        if isinstance(order_id, str):
            order_data = get_user_order_service(
                d=get_data, auth_user_id=claims.get("sub")
            )
            if (
                isinstance(order_data, dict)
                and order_data.get(order_id).get("order_status") == OrderStatus.pending
            ):
                res = delete_order_service(request_data=get_data)
                if res:
                    return response("success", "Заказ успешно удален", 200)
                return response("failed", "Не удается удалить заказ", 503)
            return response(
                "failed",
                "Удалить можно только неоплаченный заказа",
                403,
            )
        return response("failed", "Неверные данные", 400)
    return response("failed", "Доступ запрещен", 403)


@order.route("/api/order/confirm", methods=["POST"])
@jwt_required()
def confirm_order_view():
    """Завершение выполнения заказа.
    :return: Json ответ или сообщение об ошибке.
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    user_id = claims.get("sub")
    if Right.edit_order_status in user_rights:
        if request.content_type == "application/json":
            post_data = request.get_json()
            if validate_request_data(post_data=post_data, confirm=True):
                confirmation_result = confirm_order_service(post_data, user_id)
                if isinstance(confirmation_result, bool) and confirmation_result:
                    return response(
                        "success", "Заказ подтвержден", 200, data=confirmation_result
                    )
                elif isinstance(confirmation_result, list):
                    return response(
                        "success",
                        "Заказ подтвержден. На складе осталось мало ингредиентов!",
                        200,
                        data=confirmation_result,
                    )
                    # TODO отправка push о низком остатке всем пользователям
                    # с правами доступа редактирования склада
                return response("failed", "Ошибка при подтверждении", 500)
            return response("failed", "Неверные данные", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)


@order.route("/api/order/get", methods=["GET"])
@jwt_required()
def get_order_list():
    """Получение списка заказов.
    :return: Json ответ или сообщение об ошибке.
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    read_all_order_right = Right.read_all_orders in user_rights
    auth_user_id = claims.get("sub")
    get_data = request.values.to_dict()
    validated_get_data = validate_get_data(get_data)
    if isinstance(validated_get_data, dict):
        order_data = get_user_order_service(
            d=validated_get_data,
            auth_user_id=auth_user_id,
            force=read_all_order_right,
            heavy=False if get_data.get("light") else True,
        )
        if isinstance(order_data, type(None)):
            return response("success", "Данных по указанному запросу не найдено", 202)
        elif isinstance(order_data, bool) and not order_data:
            return response("failed", "Доступ запрещен", 403)
        return response("success", "Данные успешно получены", 200, data=order_data)
    return response("failed", "Неверные данные", 400)


@order.route("/api/order/purshare", methods=["GET"])
@jwt_required()
def dummy_purchase_page():
    """Оплата заказа.
    :return: Json ответ или сообщение об ошибке.
    """
    claims = get_jwt()
    user_rights = claims.get("rights")
    user_id = claims.get("sub")
    get_data = request.values.to_dict()
    order_id = get_data.get("order_id")
    if Right.purchase_order in user_rights:
        if isinstance(order_id, str):
            order_list = get_user_order_service(
                d={"order_id": order_id, "user_id": user_id},
                auth_user_id=user_id,
                force=True,
                heavy=True,
            )
            if isinstance(order_list, dict) and len(order_list) != 0:
                if (
                    order_list.get(list(order_list)[0]).get("order_status")
                    == OrderStatus.pending
                ):
                    change_purshare_status(order_id)
                    return response(
                        "success",
                        "Заказ был успешно оплачен",
                        200,
                        data={
                            "order_id": order_id,
                            "order_status": OrderStatus.payed,
                        },
                    )
                return response("failed", "Данный заказ уже оплачен", 403)
            return response("failed", "Заказа с таким номер не существует", 404)
        return response("failed", "Необходимо указать номер заказа", 400)
    return response("failed", "Доступ запрещен", 403)

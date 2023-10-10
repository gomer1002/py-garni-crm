from flask import Blueprint, request
from garni_app.models.right import Right
from garni_app.api.menu.services import (
    validate_request_data,
    upload_files,
    get_menu_json,
    get_menu_images_list,
    update_menu_item_service,
    delete_menu_image,
)
from garni_app.services import response


from flask_jwt_extended import jwt_required, get_jwt

menu = Blueprint("menu", __name__)


@menu.route("/api/menu/get", methods=["GET"])
def get_menu_items_list_view():
    """Получение меню в виде json.
    :return:
    """
    return response("success", "Данные успешно получены", 200, data=get_menu_json())


@menu.route("/api/memu/update", methods=["POST"])
@jwt_required()
def update_menu_item_view():
    claims = get_jwt()
    if Right.access_admin_panel in claims.get("rights"):
        if request.content_type == "application/json":
            post_data = request.get_json()
            if validate_request_data(post_data):
                if update_menu_item_service(post_data):
                    return response("success", "Данные успешно обновлены", 200)
                return response("failed", "Не удалось обновить даныне", 503)
            return response("failed", "Неверный формат данных", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)


############# images views #############
@menu.route("/api/image/get", methods=["GET"])
@jwt_required()
def get_menu_images_list_view():
    claims = get_jwt()
    if Right.access_admin_panel in claims.get("rights"):
        data = get_menu_images_list()
        if isinstance(data, list):
            return response(
                "success",
                "Данные успешно получены",
                200,
                data=data,
            )
        return response("failed", "Не удалось получить данные", 503)
    return response("failed", "Доступ запрещен", 403)


@menu.route("/api/image/del", methods=["post"])
@jwt_required()
def delete_menu_image_view():
    claims = get_jwt()
    if Right.access_admin_panel in claims.get("rights"):
        if request.content_type == "application/json":
            post_data = request.get_json()
            image_name = post_data.get("image_name")
            if isinstance(image_name, str):
                if delete_menu_image(image_name):
                    return response("success", "Изображение успешно удалено", 200)
                return response("failed", "Не удалось удалить изображение", 503)
            return response("failed", "Неверный формат данных", 400)
        return response("failed", "Необходимо передать json", 202)
    return response("failed", "Доступ запрещен", 403)


@menu.route("/api/image/upload", methods=["POST"])
@jwt_required()
def upload_menu_images_view():
    claims = get_jwt()
    if Right.access_admin_panel in claims.get("rights"):
        if "menu_images" in request.files:
            file_list = request.files.getlist("menu_images")
            uploaded_file_url_list = upload_files(file_list)
            if len(uploaded_file_url_list) > 0:
                return response(
                    "success",
                    "Файлы успешно загружены",
                    201,
                    data=uploaded_file_url_list,
                )
            return response("failed", "Не удалось загрузить файлы", 500)
        return response("failed", "В запросе нет файлов", 400)
    return response("failed", "Доступ запрещен", 403)

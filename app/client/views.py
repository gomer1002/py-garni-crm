from flask import (
    Blueprint,
    redirect,
    request,
    make_response,
    render_template,
    url_for,
)
from app.models.right import Right

from flask_jwt_extended import jwt_required
from flask_jwt_extended import get_jwt

client = Blueprint(
    "client",
    __name__,
    static_url_path="/client/static/",
    static_folder="static",
    template_folder="templates",
)


@client.route("/")
def main_page():
    """
    Главная страница сайта
    :return:
    """
    response = make_response(render_template("client/index.html"))
    return response


@client.route("/login/")
@jwt_required(optional=True)
def login_page():
    """
    Страница авторизации и регистрации
    :return:
    """
    claims = get_jwt()
    show_login = True
    if claims.get("rights"):
        show_login = False
    response = make_response(
        render_template("client/login.html", show_login=show_login)
    )
    return response


@client.route("/kitchen/")
@jwt_required(optional=True)
def kitchen_page():
    """
    Страница кухни
    :return:
    """
    claims = get_jwt()
    show_login = True
    auth_message = ""
    if claims.get("rights"):
        if Right.access_kitchen_panel in claims.get("rights"):
            show_login = False
        else:
            auth_message = "Для доступа к данным недостаточно прав."
    return make_response(
        render_template(
            "client/kitchen.html", show_login=show_login, auth_message=auth_message
        )
    )


@client.route("/admin/")
@client.route("/admin/<string:target>/")
@jwt_required(optional=True)
def admin_page(target=None):
    """
    Админ панель
    :return:
    """
    target_list = {
        "users": "users_page",
        "storage": "storage_page",
        "menu": "menu_page",
    }
    claims = get_jwt()
    options = {"show_login": True, "auth_message": ""}

    if claims.get("rights"):
        if Right.access_admin_panel in claims.get("rights"):
            options["show_login"] = False
            if target in target_list.keys():
                options[target_list[target]] = True
        else:
            options["auth_message"] = "Для доступа к данным недостаточно прав."
    return make_response(render_template("client/admin.html", **options))


@client.route("/test/")
def some_test():
    print("TEST FORM VALUES", request.values)
    print("TEST FORM JSON", request.get_json())
    return make_response(redirect(url_for("client.admin_page")))


################### dummy purshare ##################################
@client.route("/purshare")
def dummy_purshare_page():
    """
    Страница для оплаты заказа
    :return:
    """
    get_data = request.values.to_dict()
    order_id = get_data.get("order_id")
    response = make_response(
        render_template(
            "client/dummy_purshare.html", order_id=order_id if order_id else ""
        )
    )
    return response

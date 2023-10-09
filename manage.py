import os
import json

# import redis
# from threading import Thread

base_dir = os.path.abspath(os.path.dirname(__file__))
conf = json.loads(open(os.path.join(base_dir, "config.json"), "r").read())

os.environ["SYS_ROOT_URL"] = conf["SYS_ROOT_URL"]
os.environ["SYS_PEPPER"] = conf["SYS_PEPPER"]
os.environ["REDIS_URL"] = conf["REDIS_URL"]
os.environ["JWT_SECRET_KEY"] = conf["JWT_SECRET_KEY"]
os.environ["FIREBASE_DATABASE"] = json.dumps(conf["FIREBASE_DATABASE"])
os.environ["DER_BASE64_ENCODED_PRIVATE_KEY"] = conf["DER_BASE64_ENCODED_PRIVATE_KEY"]
os.environ["DER_BASE64_ENCODED_PUBLIC_KEY"] = conf["DER_BASE64_ENCODED_PUBLIC_KEY"]


# def run_redis():
#     r = redis.from_url(os.environ.get("REDIS_URL"))
#     try:
#         r.ping()
#     except redis.exceptions.ConnectionError as e:
#         print("starting redis . . . STARTING")
#         os.system("redis-server.exe")
#     else:
#         print("starting redis . . . OK")


from flask_script import Manager
from app import app
import hashlib
import re
from app.models.user import User
from app.models.right import Right

# Initializing the manager
manager = Manager(app)


@manager.option(
    "-n",
    "--name",
    help="Имя пользователя, по умолчанию 'Admin'",
    dest="name",
    default="Admin",
)
@manager.option("-t", "--tel", help="Телефон пользователя", dest="phone", default=None)
@manager.option(
    "-p", "--pass", help="Пароль пользователя", dest="password", default=None
)
def create_superuser(name=None, phone=None, password=None):
    """Создание суперпользователя"""
    flag = True
    if isinstance(phone, type(None)) or not re.match(
        r"(7)(\d){10}$",
        phone,
    ):
        print(
            "Необходимо указать телефон пользователя в формате 71234567890. (ключ -t или --tel)"
        )
        flag = False

    if isinstance(password, type(None)):
        print("Необходимо указать пароль пользователя. (ключ -p или --pass)")
        flag = False
    elif len(password) < 7:
        print("Пароль пользователя должен быть не менее 8 символов.")
        flag = False

    if flag:
        result = hashlib.md5(password.encode("utf-8"))
        password_hashed = result.hexdigest().upper()
        print(
            f"""Данные суперпользователя:
    Имя: {name}
    Телефон: {phone}
    Пароль: {password}"""
        )
        ans = input("Введите 'y' для подтверждения: ")
        if ans.lower() in ["y", "yes", "да"]:
            print("Получение данных . . . ", end="")
            user = User.get_by_phone(phone=phone)
            print("ok")
            if isinstance(user, type(None)):
                print("Создание пользователя . . . ", end="")
                result = User(
                    password=password_hashed,
                    name=name,
                    phone=phone,
                    rights=Right.get_list(),
                ).save()
                if isinstance(result, str):
                    return "ok\nСуперпользователь успешно создан."
                return "error\nНе удалось создать суперпользователя."
            return "Пользователь с таким номером телефона уже существует."
        return "Создание суперпользователя прервано."


@manager.command
def test():
    from flask.views import MethodView

    class Foo:
        def __init__(self):
            pass

    print(dir(Foo))
    print("ok")


@manager.command
def runserver():
    """Запуск redis сервера и Flask development сервера"""
    # redis_server = Thread(target=run_redis, args=(), daemon=True)
    # redis_server.start()
    app.run(host="0.0.0.0", port="80")


# Run the manager
if __name__ == "__main__":
    manager.run()

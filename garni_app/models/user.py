import bcrypt
import uuid

from garni_app.garni_app import app
from garni_app.garni_app import logger
from garni_app.garni_app import firestore_db

from firebase_admin.exceptions import FirebaseError

from garni_app.services import get_time
from garni_app.models.role import Role
from garni_app.models.right import Right
from flask_jwt_extended import create_access_token


class User:
    """
    Модель пользователя.
    """

    __tablename__ = "users"

    def __init__(
        self,
        user_id=None,
        password=None,
        rights=None,
        push_data=None,
        role=None,
        name=None,
        phone=None,
    ):
        """Инициализация экземпляра класса пользователя.
        :return: None."""
        self.user_id = user_id if user_id else str(uuid.uuid4())
        self.name = name
        self.phone = phone
        self.password = password
        self.role = role if role else Role.user
        self.rights = (
            rights
            if isinstance(rights, list) or isinstance(rights, bool)
            else [
                Right.access_user_panel,
                Right.place_order,
                Right.purchase_order,
            ]
        )
        self.push_data = push_data
        self.registered_on = get_time()
        self.registered_on_unix = get_time(get_timestamp=True)

    def serialize(self, with_register=False) -> dict:
        """Сериализация экземпляра класса в словарь.
        :return: dict."""
        data = {}
        if self.user_id:
            data["user_id"] = self.user_id
        if self.name:
            data["name"] = self.name
        if isinstance(self.rights, list):
            data["rights"] = self.rights
        if self.push_data:
            data["push_data"] = self.push_data
        if self.role:
            data["role"] = self.role
        if self.phone:
            data["phone"] = self.phone
        if self.password:
            data["password"] = self._salt_password(self._pepper_password(self.password))
        if with_register:
            if self.registered_on:
                data["registered_on"] = self.registered_on
            if self.registered_on_unix:
                data["registered_on_unix"] = self.registered_on_unix
        return data

    def save(self):
        """Запись пользователя в базу данных.
        :return: jwt токен или None."""
        try:
            data_reference = f"{self.__tablename__}/{self.user_id}"
            ref = firestore_db.document(data_reference)
            doc = ref.get()
            if doc.exists:
                ref.update(self.serialize())
            else:
                ref.set(self.serialize(with_register=True))
            additional_claims = {
                "rights": self.rights,
                "role": self.role,
                "name": self.name,
            }
            return create_access_token(
                identity=self.user_id,
                additional_claims=additional_claims,
            )
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    def sign_in(self):
        """Проверка данных пользователя и генерация jwt токена.
        :return: jwt токен или None."""
        try:
            user = self.get_by_phone(self.phone)
            if isinstance(user, dict):
                db_password = user.get("data").get("password").encode("utf-8")
                candidate = self._pepper_password(self.password)
                if bcrypt.checkpw(candidate, db_password):
                    user_id = user["user_id"]
                    additional_claims = {
                        "rights": user["data"]["rights"],
                        "role": user["data"]["role"],
                        "name": user["data"]["name"],
                    }
                    return create_access_token(
                        identity=user_id,
                        additional_claims=additional_claims,
                    )
            return None
        except ValueError as e:
            logger.error(str(e))
            return None

    @staticmethod
    def _pepper_password(password: str) -> str:
        """Добавление к паролю пользователя локального секретного ключа.
        :return: str: строка с локальным секретным ключом и исходной строкой."""
        pepper = app.config.get("PEPPER")
        return f"{password}{pepper}".encode("utf-8")

    @staticmethod
    def _salt_password(password: str) -> str:
        """Добавление к паролю пользователя локального уникального ключа
        и хэширование пароля с помощью алгоритма bcrypt.
        :return: str: закодированная с помощью bcrypt строка."""
        return bcrypt.hashpw(
            password,
            bcrypt.gensalt(),
        ).decode("utf-8")

    @classmethod
    def get(cls):
        """Получение списка пользователей.
        :return: dict с данными о пользователе или None."""
        try:
            ref = firestore_db.collection(cls.__tablename__)
            ref = ref.order_by("registered_on_unix", direction="DESCENDING")

            docs = ref.stream()
            data = {}
            k = 0
            for doc in docs:
                ud = doc.to_dict()
                data[k] = {
                    "user_id": ud["user_id"],
                    "name": ud["name"],
                    "rights": ud["rights"],
                    "role": ud["role"],
                    "phone": ud["phone"],
                    "registered_on": ud["registered_on"],
                    "registered_on_unix": ud["registered_on_unix"],
                }
                k += 1
            return data
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    @classmethod
    def get_by_id(cls, user_id):
        """Получение данных пользователя по его id.
        :return: dict с данными о пользователе или None."""
        try:
            ref = firestore_db.collection(cls.__tablename__).document(user_id)
            doc = ref.get()
            data = {}
            if doc.exists:
                data[doc.id] = doc.to_dict()
            return data
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    @classmethod
    def get_by_phone(cls, phone: str) -> dict | None:
        """Получение данных пользователя по его телефону.
        :return: dict с данными о пользователе или None."""
        try:
            ref = (
                firestore_db.collection(cls.__tablename__)
                .where("phone", "==", phone)
                .limit(1)
            )
            docs = ref.stream()
            for doc in docs:
                if doc.exists:
                    return {
                        "user_id": doc.id,
                        "data": doc.to_dict(),
                    }
                else:
                    return None
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    @classmethod
    def delete(cls, user_id: str) -> bool | None:
        """Удаление пользователя из БД.
        :return: True или False."""
        try:
            data_reference = f"{cls.__tablename__}/{user_id}"
            ref = firestore_db.document(data_reference)
            ref.delete()
            return True
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    @classmethod
    def update(cls, data: dict) -> bool | None:
        """Обновление данных пользователя.
        :return: True или False."""
        try:
            data_reference = f"{cls.__tablename__}/{data['user_id']}"
            ref = firestore_db.document(data_reference)
            ref.update(data)
            return True
        except (FirebaseError, ValueError, KeyError) as e:
            logger.error(str(e))
            return None

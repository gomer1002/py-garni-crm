import uuid

from app.services import get_time
from app import logger

from firebase_admin import firestore
from firebase_admin.exceptions import FirebaseError
from flask.views import MethodView


class Menu(MethodView):
    """
    Table schema
    """

    __tablename__ = "menu"

    def __init__(
        self,
        item_id: str = None,
        item_name: str = None,
        item_description: str = None,
        available_to_order: bool = None,
        show: bool = None,
        img_urls: list = None,
        composition: list = None,
        portion_weight: int = None,
        portion_calories: int = None,
        tags: list = None,
        category: str = None,
        price: float = None,
    ):
        self.item_id = item_id if item_id else str(uuid.uuid4())
        self.item_name = item_name
        self.item_description = item_description
        self.available_to_order = available_to_order
        self.show = show
        self.img_urls = img_urls
        self.composition = composition
        self.portion_weight = portion_weight
        self.portion_calories = portion_calories
        self.tags = tags
        self.category = category
        self.price = price
        self.updated_on = get_time()
        self.updated_on_unix = get_time(get_timestamp=True)

    def ref(self):
        firestore_db = firestore.client()
        data_reference = f"{self.__tablename__}/{self.item_id}"
        ref = firestore_db.document(data_reference)
        return ref

    def serialize(self):
        """
        Функция "упаковки" данных в json объект для записи в БД.
        :return: json (словарь) со всеми параметрами экземпляра класса.
        """
        data = {}
        if self.item_id:
            data["item_id"] = self.item_id
        if self.item_name:
            data["item_name"] = self.item_name
        if self.item_description:
            data["item_description"] = self.item_description
        if self.img_urls:
            data["img_urls"] = self.img_urls
        if self.composition:
            data["composition"] = self.composition
        if self.portion_weight:
            data["portion_weight"] = self.portion_weight
        if self.portion_calories:
            data["portion_calories"] = self.portion_calories
        if self.tags:
            data["tags"] = self.tags
        if self.category:
            data["category"] = self.category
        if self.price:
            data["price"] = self.price

        data["show"] = self.show
        data["available_to_order"] = self.available_to_order
        data["updated_on"] = self.updated_on
        data["updated_on_unix"] = self.updated_on_unix
        return data

    def save(self):
        """
        Функция сохранения нового элемента меню в БД
        или обновления существующего.
        :return: True если запись успешна, иначе False.
        """
        try:
            firestore_db = firestore.client()
            data_reference = f"{self.__tablename__}/{self.item_id}"
            ref = firestore_db.document(data_reference)
            doc = ref.get()
            if doc.exists:
                ref.update(self.serialize())
            else:
                ref.set(self.serialize())
            return True

        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return False

    @classmethod
    def get(cls, item_id: str = None) -> dict:
        """
        Функция получения элементов меню если указан item_id.
        :return: один элемент при указании item_id,
        иначе список item_id всех элементов.
        """
        data = {}
        try:
            firestore_db = firestore.client()
            if isinstance(item_id, str):
                ref = firestore_db.collection(cls.__tablename__).document(item_id)
                doc = ref.get()
                if doc.exists:
                    data[0] = doc.to_dict()
                return data
            else:
                ref = firestore_db.collection(cls.__tablename__)
                docs = ref.get()
                for doc in docs:
                    data[doc.id] = doc.to_dict()
                return data

        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

import uuid

from garni_app.services import get_time
from garni_app.garni_app import logger
from garni_app.garni_app import firestore_db

from firebase_admin.exceptions import FirebaseError


class Storage:
    """
    Table schema
    """

    __tablename__ = "storage"

    def __init__(
        self,
        ingredient_id=None,
        ingredient_name=None,
        amount=None,
        min_amount=None,
        unit=None,
        tags=None,
    ):
        self.ingredient_id = ingredient_id if ingredient_id else str(uuid.uuid4())
        self.ingredient_name = ingredient_name
        self.amount = amount
        self.min_amount = min_amount
        self.unit = unit
        self.tags = tags
        self.updated_on = get_time()
        self.updated_on_unix = get_time(get_timestamp=True)

    def ref(self):
        data_reference = f"{self.__tablename__}/{self.ingredient_id}"
        ref = firestore_db.document(data_reference)
        return ref

    def update(self):
        try:
            ref = self.ref()
            data = self.serialize()
            if data.get("amount"):
                del data["amount"]
            ref.update(data)
            return True
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    def serialize(self):
        """
        Функция "упаковки" данных в json объект для записи в БД.
        :return: json (словарь) со всеми параметрами экземпляра класса.
        """
        data = {}
        if self.ingredient_id:
            data["ingredient_id"] = self.ingredient_id
        if self.ingredient_name:
            data["ingredient_name"] = self.ingredient_name
        if self.amount:
            data["amount"] = self.amount
        if self.min_amount:
            data["min_amount"] = self.min_amount
        if self.unit:
            data["unit"] = self.unit
        if self.tags:
            data["tags"] = self.tags
        if self.updated_on:
            data["updated_on"] = self.updated_on
        if self.updated_on_unix:
            data["updated_on_unix"] = self.updated_on_unix
        return data

    @classmethod
    def get(cls, ingredient_id=None):
        """
        Функция получения элемента склада если был указан ingredient_id.
        :return: один элемент если был указан ingredient_id,
        иначе список всех элементов. В случае ошибки возвращает None.
        """
        try:
            if ingredient_id:
                ref = firestore_db.collection(cls.__tablename__).document(ingredient_id)
                doc = ref.get()
                data = {}
                if doc.exists:
                    data[doc.id] = doc.to_dict()
                return data
            else:
                ref = firestore_db.collection(cls.__tablename__)
                # ref = ref.order_by("updated_on_unix", direction="DESCENDING")

                docs = ref.stream()
                data = {}
                for doc in docs:
                    data[doc.id] = doc.to_dict()
                return data

        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

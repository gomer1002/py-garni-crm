import uuid

from app.services import get_time
from app import logger

from firebase_admin import firestore
from flask.views import MethodView

from firebase_admin.exceptions import FirebaseError
from google.api_core.exceptions import FailedPrecondition


class StorageMovement(MethodView):
    """
    Table schema
    """

    __tablename__ = "storage_movement"

    def __init__(
        self,
        ingredient_id=None,
        amount=None,
        direction=None,
        author=None,
    ):
        self.movement_id = str(uuid.uuid4())
        self.movement_date = get_time()
        self.movement_date_unix = get_time(get_timestamp=True)
        self.ingredient_id = ingredient_id
        self.amount = amount
        self.direction = direction
        self.author = author

    def ref(self):
        firestore_db = firestore.client()
        data_reference = f"{self.__tablename__}/{self.movement_id}"
        ref = firestore_db.document(data_reference)
        return ref

    def serialize(self):
        """
        Функция "упаковки" данных в json объект для записи в БД.
        :return: json (словарь) со всеми параметрами экземпляра класса.
        """
        return {
            "movement_id": self.movement_id,
            "movement_date": self.movement_date,
            "movement_date_unix": self.movement_date_unix,
            "ingredient_id": self.ingredient_id,
            "amount": self.amount,
            "direction": self.direction,
            "author": self.author,
        }

    @classmethod
    def get(
        cls,
        ingredient_id=None,
        order_items_by=None,
        order_direction=None,
        from_date=None,
        to_date=None,
        limit=None,
    ):
        """
        Функция получения истории изменения склада.
        :return: json с данными, либо None.
        """
        order_items_by = order_items_by if order_items_by else "movement_date_unix"
        order_direction = order_direction if order_direction else "ASCENDING"
        limit = limit if limit else 50

        try:
            firestore_db = firestore.client()

            ref = firestore_db.collection(cls.__tablename__)

            if ingredient_id:
                ref = ref.where("ingredient_id", "==", ingredient_id)
            if from_date:
                ref = ref.where("movement_date_unix", ">=", from_date)
            if to_date:
                ref = ref.where("movement_date_unix", "<=", to_date)

            ref = ref.order_by(order_items_by, direction=order_direction)
            ref = ref.limit(limit)

            docs = ref.get()
            data = {}
            k = 0
            for doc in docs:
                data[k] = doc.to_dict()
                k += 1
            return data

        except (FirebaseError, ValueError, FailedPrecondition) as e:
            logger.error(str(e))
            return None

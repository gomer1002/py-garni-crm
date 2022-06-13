import uuid

from app.services import get_time
from app import logger
from app import firestore_db

from firebase_admin.exceptions import FirebaseError

from app.models.order_status import OrderStatus


class Order:
    """
    Table schema
    """

    __tablename__ = "orders"

    def __init__(
        self,
        order_id=None,
        user_id=None,
        table_id=None,
        order_type=None,
        items_list=None,
        discount=None,
        price=None,
        delivery_addres=None,
        order_status=None,
        new_order=False,
        payed=False,
        finished=False,
    ):
        self.order_id = order_id if order_id else str(uuid.uuid4())
        self.user_id = user_id
        self.table_id = table_id
        self.order_type = order_type
        self.items_list = items_list
        self.discount = discount
        self.price = price
        self.delivery_addres = delivery_addres
        self.order_status = order_status if order_status else OrderStatus.pending
        self.new_order = new_order
        self.payed = payed
        self.finished = finished
        if new_order:
            self.created_on = get_time()
            self.created_on_unix = get_time(get_timestamp=True)
        if payed:
            self.payed_on = get_time()
            self.payed_on_unix = get_time(get_timestamp=True)
        if finished:
            self.finished_on = get_time()
            self.finished_on_unix = get_time(get_timestamp=True)

    def ref(self):
        data_reference = f"{self.__tablename__}/{self.order_id}"
        ref = firestore_db.document(data_reference)
        return ref

    def serialize(self):
        """
        Функция "упаковки" данных в json объект для записи в БД.
        :return: json (словарь) со всеми параметрами экземпляра класса.
        """
        data = {}
        if self.order_id:
            data["order_id"] = self.order_id
        if self.user_id:
            data["user_id"] = self.user_id
        if self.table_id:
            data["table_id"] = self.table_id
        if self.order_type:
            data["order_type"] = self.order_type
        if self.items_list:
            data["items_list"] = self.items_list
        if self.discount:
            data["discount"] = self.discount
        if self.price:
            data["price"] = self.price
        if self.delivery_addres:
            data["delivery_addres"] = self.delivery_addres
        if self.order_status:
            data["order_status"] = self.order_status
        if self.new_order:
            data["created_on"] = self.created_on
            data["created_on_unix"] = self.created_on_unix
        if self.payed:
            data["payed_on"] = self.payed_on
            data["payed_on_unix"] = self.payed_on_unix
        if self.finished:
            data["finished_on"] = self.finished_on
            data["finished_on_unix"] = self.finished_on_unix
        return data

    def save(self):
        """
        Функция сохранения нового заказа в БД
        или обновления существующего.
        :return: True если запись успешна, иначе False.
        """
        try:
            data_reference = f"{self.__tablename__}/{self.order_id}"
            ref = firestore_db.document(data_reference)
            doc = ref.get()
            data = self.serialize()
            if doc.exists:
                ref.update(data)
            else:
                ref.set(data)
            return self

        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return False

    @classmethod
    def get(
        cls,
        order_id: str = None,
        user_id: str = None,
        order_type: str = None,
        order_status: str = None,
        sort_by: str = None,
        sort_direction: str = None,
        from_date: int = None,
        to_date: int = None,
        limit: int = None,
    ) -> dict | None:
        """
        Функция получения элементов меню если указан order_id.
        :return: один элемент при указании order_id,
        иначе список order_id всех элементов.
        """
        sort_by = sort_by if sort_by else "created_on_unix"
        sort_direction = sort_direction if sort_direction else "ASCENDING"
        limit = limit if limit else 20

        data = {}
        try:
            ref = firestore_db.collection(cls.__tablename__)

            if order_id:
                ref = ref.document(order_id)
                doc = ref.get()
                if doc.exists:
                    data[doc.id] = doc.to_dict()
                    # data[0] = doc.to_dict()
                return data
            else:
                docs = ref.stream()
                for doc in docs:
                    temp = doc.to_dict()
                    if (
                        (user_id and user_id != temp["user_id"])
                        or (order_type and order_type != temp["order_type"])
                        or (order_status and order_status != temp["order_status"])
                    ):
                        continue
                    data[doc.id] = temp

                data_sorted = dict(
                    sorted(
                        data.items(),
                        key=lambda k_v: float(k_v[1][sort_by]),
                        reverse={"ASCENDING": False, "DESCENDING": True}[
                            sort_direction
                        ],
                    )
                )
                return data_sorted

        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

    @classmethod
    def delete(cls, order_id):
        """
        Функция удаления заказа из БД.
        :return: True если запись успешна, иначе False.
        """
        try:
            data_reference = f"{cls.__tablename__}/{order_id}"
            ref = firestore_db.document(data_reference)
            ref.delete()
            return True
        except (FirebaseError, ValueError) as e:
            logger.error(str(e))
            return None

from firebase_admin import firestore

from app.models.order_status import OrderStatus
from app.models.order import Order
from app.models.menu import Menu
from app.models.storage import Storage
from app.models.storage_movement import StorageMovement
from app.models.movement_direction import MovementDirection as MD
from app.api.push.services import send_web_push
from app import logger


class Transaction:
    def confirm_order(order_id: str, author: str) -> bool:
        """
        Функция подтверждения заказа, обновления остатка продуктов
        на складе, а также добавления записей об этих изменениях.
        :return: True если запись успешна, иначе False.
        """
        firestore_db = firestore.client()
        transaction = firestore_db.transaction()
        order_ref = Order(order_id=order_id).ref()

        @firestore.transactional
        def update_in_transaction(transaction, order_ref, author):
            order_data = order_ref.get(transaction=transaction).to_dict()
            user_id = order_data.get("user_id")
            order_id = order_data.get("order_id")

            movement_list = []
            storage_list = {}
            storage_warning = []

            for item in order_data.get("items_list"):
                item_id = item["item_id"]
                item_qty = item["qty"]
                item_ref = Menu(item_id=item_id).ref()
                item_data = item_ref.get(transaction=transaction).to_dict()

                for ingredient_element in item_data.get("composition"):
                    ingredient_id = ingredient_element["ingredient_id"]
                    ingredient_amount = ingredient_element["amount"] * item_qty

                    storage = Storage(ingredient_id=ingredient_id)
                    storage_ref = storage.ref()
                    storage_data = storage_ref.get(transaction=transaction).to_dict()
                    storage_updated_on = storage.updated_on
                    storage_updated_on_unix = storage.updated_on_unix
                    storage_amount = storage_data.get("amount")
                    storage_min_amount = storage_data.get("min_amount")

                    new_storage_movement = StorageMovement(
                        ingredient_id=ingredient_id,
                        amount=ingredient_amount,
                        author=author,
                        direction=MD.decrease,
                    )

                    storage_movement_ref = new_storage_movement.ref()
                    storage_movement_data = new_storage_movement.serialize()
                    movement_list.append((storage_movement_ref, storage_movement_data))

                    if storage_list.get(ingredient_id) == None:
                        storage_list[ingredient_id] = {
                            "ref": storage_ref,
                            "data": {
                                "amount": storage_amount - ingredient_amount,
                                "updated_on": storage_updated_on,
                                "updated_on_unix": storage_updated_on_unix,
                                "min_amount": storage_min_amount,
                            },
                        }
                    else:
                        storage_list[ingredient_id]["data"][
                            "amount"
                        ] -= ingredient_amount

            for ref, data in movement_list:
                transaction.set(ref, data)

            for ingredient_id in list(storage_list):
                transaction.update(
                    storage_list[ingredient_id]["ref"],
                    storage_list[ingredient_id]["data"],
                )

                amount = storage_list[ingredient_id]["data"]["amount"]
                if storage_min_amount >= amount:
                    storage_warning.append(
                        {
                            "ingredient_id": ingredient_id,
                            "amount": amount,
                            "min_amount": storage_min_amount,
                        }
                    )

            push_data = {"message": f"Заказ номер {order_id} готов!"}
            send_web_push(user_id=user_id, message_data=push_data)
            transaction.update(order_ref, {"order_status": OrderStatus.succeeded})

            if len(storage_warning) != 0:
                return storage_warning
            return True

        try:
            return update_in_transaction(transaction, order_ref, author)
        except (TypeError, KeyError, ValueError) as e:
            logger.error(str(e))
            return False

    def update_storage_item_amount(
        ingredient_id: str = None,
        ingredient_amount: int = None,
        direction: str = None,
        author: str = None,
    ) -> bool | tuple:
        """
        Функция обновления остатка продуктов на складе,
        а также добавления записей об этих изменениях.
        :return: True если запись успешна, иначе False.
        """
        firestore_db = firestore.client()
        transaction = firestore_db.transaction()

        @firestore.transactional
        def update_in_transaction(
            transaction, ingredient_id, ingredient_amount, direction, author
        ):
            storage = Storage(ingredient_id=ingredient_id)
            storage_ref = storage.ref()
            storage_data = storage_ref.get(transaction=transaction).to_dict()
            storage_updated_on = storage.updated_on
            storage_updated_on_unix = storage.updated_on_unix
            storage_amount = storage_data.get("amount")
            storage_min_amount = storage_data.get("min_amount")
            new_amount = storage_amount

            if direction == MD.decrease and storage_amount >= ingredient_amount:
                new_amount = storage_amount - ingredient_amount
            elif direction == MD.increase:
                new_amount = storage_amount + ingredient_amount
            else:
                return False

            new_storage_movement = StorageMovement(
                ingredient_id=ingredient_id,
                amount=ingredient_amount,
                author=author,
                direction=direction,
            )
            storage_movement_ref = new_storage_movement.ref()
            storage_movement_data = new_storage_movement.serialize()

            transaction.set(storage_movement_ref, storage_movement_data)
            new_storage_data = {
                "amount": new_amount,
                "updated_on": storage_updated_on,
                "updated_on_unix": storage_updated_on_unix,
            }
            transaction.update(storage_ref, new_storage_data)
            if storage_min_amount >= new_amount:
                return (new_amount, storage_min_amount)
            return True

        try:
            return update_in_transaction(
                transaction, ingredient_id, ingredient_amount, direction, author
            )
        except (TypeError) as e:
            logger.error(str(e))
            return False

    def set_new_storage_item(
        ingredient_name=None,
        ingredient_amount=None,
        ingredient_min_amount=None,
        unit=None,
        tags=None,
        author=None,
    ):
        """
        Функция обновления остатка продуктов на складе,
        а также добавления записей об этих изменениях.
        :return: True если запись успешна, иначе False.
        """
        firestore_db = firestore.client()
        transaction = firestore_db.transaction()

        @firestore.transactional
        def update_in_transaction(
            transaction,
            ingredient_name,
            ingredient_amount,
            ingredient_min_amount,
            author,
            unit,
            tags,
        ):
            ingredient = Storage(
                ingredient_name=ingredient_name,
                amount=ingredient_amount,
                min_amount=ingredient_min_amount,
                unit=unit,
                tags=tags,
            )
            ingredient_id = ingredient.ingredient_id
            ingredient_ref = ingredient.ref()
            ingredient_data = ingredient.serialize()

            direction = MD.setting

            new_storage_movement = StorageMovement(
                ingredient_id=ingredient_id,
                amount=ingredient_amount,
                author=author,
                direction=direction,
            )
            storage_movement_ref = new_storage_movement.ref()
            storage_movement_data = new_storage_movement.serialize()

            transaction.set(storage_movement_ref, storage_movement_data)
            transaction.set(ingredient_ref, ingredient_data)
            return True

        try:
            return update_in_transaction(
                transaction=transaction,
                ingredient_name=ingredient_name,
                ingredient_amount=ingredient_amount,
                ingredient_min_amount=ingredient_min_amount,
                author=author,
                unit=unit,
                tags=tags,
            )
        except (TypeError) as e:
            logger.error(str(e))
            return False

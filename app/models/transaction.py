from firebase_admin import firestore

from app.models.order_status import OrderStatus
from app.models.order import Order
from app.models.menu import Menu
from app.models.storage import Storage
from app.models.storage_movement import StorageMovement
from app.models.movement_direction import MovementDirection as MD
from app.api.push.services import send_web_push
from app import logger
from app import firestore_db


class Transaction:
    """
    Класс, реализующий обработку данных через транзации.
    """

    def confirm_order(order_id: str, author: str) -> bool | list:
        """
        Функция подтверждения заказа, обновления остатка продуктов
        на складе, а также добавления записей об этих изменениях.
        :return: True если запись успешна.
        :return: False если запись не удалась.
        :return: list если есть сообщения о низком остатке.
        """
        # инициализация подключения к БД и транзакции
        transaction = firestore_db.transaction()
        order_ref = Order(order_id=order_id).ref()

        # объявление функци, выполняющейся как транзакция БД
        @firestore.transactional
        def update_in_transaction(transaction, order_ref, author):
            # получение данных заказа
            order_data = order_ref.get(transaction=transaction).to_dict()
            user_id = order_data.get("user_id")
            order_id = order_data.get("order_id")

            # объявление переменных для записи
            # истории изменения склада
            movement_list = []
            # новых данных склада
            storage_list = {}
            # уведомлений о низком остатке
            storage_warning = []

            # в цикле по всем зказанным позициям
            for item in order_data.get("items_list"):
                # получаем данные о заказанной позиции
                item_id = item["item_id"]
                item_qty = item["qty"]
                # получаем актуальные данные из бд о позиции
                item_ref = Menu(item_id=item_id).ref()
                item_data = item_ref.get(transaction=transaction).to_dict()

                # в цикле по всем ингредиентам позиции
                for ingredient_element in item_data.get("composition"):
                    # получаем данные ингредиента
                    ingredient_id = ingredient_element["ingredient_id"]
                    ingredient_amount = ingredient_element["amount"] * item_qty

                    # создаем экземпляр ингредиента склада
                    storage = Storage(ingredient_id=ingredient_id)
                    # получаем его референс
                    storage_ref = storage.ref()
                    # получаем актуальыне данные из БД
                    storage_data = storage_ref.get(transaction=transaction).to_dict()
                    storage_updated_on = storage.updated_on
                    storage_updated_on_unix = storage.updated_on_unix
                    storage_amount = storage_data.get("amount")
                    storage_min_amount = storage_data.get("min_amount")

                    # создаем экземпляр изменения склада
                    new_storage_movement = StorageMovement(
                        ingredient_id=ingredient_id,
                        amount=ingredient_amount,
                        author=author,
                        direction=MD.decrease,
                    )

                    # получаем референс
                    storage_movement_ref = new_storage_movement.ref()
                    # получаем данные и добавляем их в список
                    storage_movement_data = new_storage_movement.serialize()
                    movement_list.append((storage_movement_ref, storage_movement_data))

                    # если в списке новых данных склада ингредиента нет
                    if storage_list.get(ingredient_id) == None:
                        # создаем запись с новыми данными
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
                        # иначе обновляем остаток
                        storage_list[ingredient_id]["data"][
                            "amount"
                        ] -= ingredient_amount

            # в цикле по всем данным из списка истории изменения склада
            for ref, data in movement_list:
                # записываем результаты в БД
                transaction.set(ref, data)

            # в цикле по всем данные из списка новых данных склада
            for ingredient_id in list(storage_list):
                # обновляем результаты в БД
                transaction.update(
                    storage_list[ingredient_id]["ref"],
                    storage_list[ingredient_id]["data"],
                )

                # проверяем минимальный остаток
                amount = storage_list[ingredient_id]["data"]["amount"]
                storage_min_amount = storage_list[ingredient_id]["data"]["min_amount"]
                # если меньше указанного
                if storage_min_amount >= amount:
                    # создаем уведомление
                    storage_warning.append(
                        {
                            "ingredient_id": ingredient_id,
                            "amount": amount,
                            "min_amount": storage_min_amount,
                        }
                    )
                    # TODO отправка push о низком остатке всем пользователям
                    # с правами доступа редактирования склада

            # отправка уведомления о готовности заказа
            # TODO перенести в views
            push_data = {"message": f"Заказ #{order_id.split('-')[0]} готов!"}
            send_web_push(user_id=user_id, message_data=push_data)
            transaction.update(order_ref, {"order_status": OrderStatus.succeeded})

            # если уведомления есть - возвращаем
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
        # инициализация подключения к БД и транзакции
        transaction = firestore_db.transaction()

        # объявление функци, выполняющейся как транзакция БД
        @firestore.transactional
        def update_in_transaction(
            transaction, ingredient_id, ingredient_amount, direction, author
        ):
            # создаем экземпляр ингредиента склада
            storage = Storage(ingredient_id=ingredient_id)
            # получаем его референс
            storage_ref = storage.ref()
            # получаем актуальыне данные из БД
            storage_data = storage_ref.get(transaction=transaction).to_dict()
            storage_updated_on = storage.updated_on
            storage_updated_on_unix = storage.updated_on_unix
            storage_amount = storage_data.get("amount")
            storage_min_amount = storage_data.get("min_amount")
            new_amount = storage_amount

            # проверка соответствия направления изменения склада
            if direction == MD.decrease and storage_amount >= ingredient_amount:
                new_amount = storage_amount - ingredient_amount
            elif direction == MD.increase:
                new_amount = storage_amount + ingredient_amount
            else:
                return False

            # создаем экземпляр изменения склада
            new_storage_movement = StorageMovement(
                ingredient_id=ingredient_id,
                amount=ingredient_amount,
                author=author,
                direction=direction,
            )
            # получаем данные
            storage_movement_ref = new_storage_movement.ref()
            storage_movement_data = new_storage_movement.serialize()

            # записываем изменение склада в БД
            transaction.set(storage_movement_ref, storage_movement_data)
            # генерируем новые данные склада
            new_storage_data = {
                "amount": new_amount,
                "updated_on": storage_updated_on,
                "updated_on_unix": storage_updated_on_unix,
            }
            # обновляем склад в БД
            transaction.update(storage_ref, new_storage_data)
            # проверка остатка
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
    ) -> bool:
        """
        Функция добавления нового ингредиента на склад.
        :return: True если запись успешна, иначе False.
        """
        # инициализация подключения к БД и транзакции
        transaction = firestore_db.transaction()

        # объявление функци, выполняющейся как транзакция БД
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
            # создаем экземпляр ингредиента склада
            ingredient = Storage(
                ingredient_name=ingredient_name,
                amount=ingredient_amount,
                min_amount=ingredient_min_amount,
                unit=unit,
                tags=tags,
            )
            # получаем его референс
            ingredient_ref = ingredient.ref()
            # получаем данные
            ingredient_id = ingredient.ingredient_id
            ingredient_data = ingredient.serialize()

            # устанавливаем направление изменения
            direction = MD.setting

            # создаем экземпляр изменения склада
            new_storage_movement = StorageMovement(
                ingredient_id=ingredient_id,
                amount=ingredient_amount,
                author=author,
                direction=direction,
            )
            # получаем данные
            storage_movement_ref = new_storage_movement.ref()
            storage_movement_data = new_storage_movement.serialize()

            # записываем все в БД
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

from types import NoneType
from app import app
from app import logger
from app.models.menu import Menu
from app.models.order import Order
from app.models.order_status import OrderStatus
from app.models.transaction import Transaction


def validate_request_data(
    post_data: dict, create: bool = False, confirm: bool = False
) -> bool:
    """Проверка полученных данных"""
    if create:
        items_list = post_data.get("items_list")
        # print("ORDER VALIDATOR ITEM LIST", items_list)
        order_type = post_data.get("order_type")
        delivery_addres = post_data.get("delivery_addres")
        return (
            isinstance(items_list, list)
            and isinstance(order_type, str)
            and isinstance(delivery_addres, (dict, NoneType))
        )

    if confirm:
        order_id = post_data.get("order_id")
        return isinstance(order_id, str)

    return False


def validate_get_data(get_data: dict) -> dict | bool:
    """Проверка полученных данных"""
    try:
        order_id = get_data.get("order_id")
        user_id = get_data.get("user_id")
        order_type = get_data.get("order_type")
        order_status = get_data.get("order_status")
        sort_by = get_data.get("sort_by")
        sort_direction = {
            "ASCENDING": "ASCENDING",
            "DESCENDING": "DESCENDING",
            None: None,
            "asc": "ASCENDING",
            "desc": "DESCENDING",
        }[get_data.get("sort_direction")]
        from_date = (
            None
            if isinstance(get_data.get("from_date"), type(None))
            else float(get_data.get("from_date"))
        )
        to_date = (
            None
            if isinstance(get_data.get("to_date"), type(None))
            else float(get_data.get("to_date"))
        )
        limit = (
            None
            if isinstance(get_data.get("limit"), type(None))
            else int(get_data.get("limit"))
        )

        return {
            "order_id": order_id,
            "user_id": user_id,
            "order_type": order_type,
            "order_status": order_status,
            "sort_by": sort_by,
            "sort_direction": sort_direction,
            "from_date": from_date,
            "to_date": to_date,
            "limit": limit,
        }
    except (ValueError, TypeError, KeyError) as e:
        logger.error(str(e))
        return False


def create_new_order_service(post_data: dict, user_id: str) -> dict | None:
    full_price = 0
    for item in post_data.get("items_list"):
        item_id = item.get("item_id")
        item_qty = item.get("qty")

        item_data = Menu.get(item_id)
        if isinstance(item_data, dict) and len(item_data) != 0:
            item_price = item_data[0].get("price")
            item_price = item_price * item_qty
            full_price += item_price
        else:
            return None

    full_price = round(full_price, 2)

    new_order = Order(
        user_id=user_id,
        order_type=post_data.get("order_type"),
        items_list=post_data.get("items_list"),
        delivery_addres=post_data.get("delivery_addres"),
        new_order=True,
        price=full_price,
    ).save()
    if isinstance(new_order, Order):
        return generate_pay_form(
            {
                "amount": {"value": str(new_order.price), "currency": "RUB"},
                "payment_method_data": {"type": "bank_card"},
                "confirmation": {
                    "type": "redirect",
                    "return_url": f"{app.config.get('SYS_ROOT_URL')}/api/order/return_url?order_id={new_order.order_id}",
                },
                "description": "Заказ №72",
            },
            new_order.order_id,
        )
    return None


def check_if_any_unpayed_orders_service(user_id):
    order_list = Order.get(user_id=user_id, order_status=OrderStatus.pending)
    if len(order_list) == 0:
        return True
    return False


def get_user_order_service(
    d: dict, auth_user_id: str, force: bool = False, heavy: bool = False
) -> NoneType | bool | dict:
    """
    Вспомогательный метод для получения информации о заказе.
    :returns: dict с данными в случае успеха.
    :returns: False в случае отсутствия прав доступа.
    :returns: None в случае отсутствия данных."""
    order_data = Order.get(
        order_id=d.get("order_id"),
        user_id=d.get("user_id"),
        order_type=d.get("order_type"),
        order_status=d.get("order_status"),
        sort_by=d.get("sort_by"),
        sort_direction=d.get("sort_direction"),
        from_date=d.get("from_date"),
        to_date=d.get("to_date"),
        limit=d.get("limit"),
    )
    if isinstance(order_data, dict) and len(order_data) != 0:
        db_user_id = order_data.get(list(order_data)[0]).get("user_id")

        if db_user_id == auth_user_id or force:
            if heavy:
                for key in list(order_data):
                    items_list = []
                    for item in order_data[key].get("items_list"):
                        item_id = item.get("item_id")
                        item_qty = item.get("qty")
                        item_data = Menu.get(item_id)

                        if len(item_data) == 0:
                            return None

                        item_data["qty"] = item_qty
                        items_list.append({item_id: item_data})
                    order_data[key]["items_list"] = items_list
            return order_data
        return False
    return None


def delete_order_service(request_data):
    return Order.delete(order_id=request_data.get("order_id"))


def confirm_order_service(post_data, author):
    order_id = post_data.get("order_id")
    return Transaction.confirm_order(order_id=order_id, author=author)


##############################################################################
### dummy functions ###
def generate_pay_form(payment_data: dict, payment_id: str) -> dict:
    return {
        "id": payment_id,
        "status": "pending",
        "paid": False,
        "amount": payment_data["amount"],
        "confirmation": {
            "type": "redirect",
            "return_url": payment_data["confirmation"]["return_url"],
            "confirmation_url": f"{app.config.get('SYS_ROOT_URL')}/purshare?order_id={payment_id}",
        },
        "created_at": "2018-07-18T10:51:18.139Z",
        "description": "Заказ №72",
        "metadata": {},
        "payment_method": {
            "type": "bank_card",
            "id": payment_id,
            "saved": False,
        },
        "recipient": {"account_id": 100001, "gateway_id": 1000001},
        "refundable": False,
        "test": True,
    }


def change_purshare_status(order_id):
    Order(order_id=order_id, order_status=OrderStatus.payed, payed=True).save()
    return True


### dummy functions ###

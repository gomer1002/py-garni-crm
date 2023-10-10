from garni_app.garni_app import logger
from garni_app.models.transaction import Transaction


def validate_get_data(get_data):
    """Проверка полученных данных"""
    try:
        ingredient_id = (
            None
            if isinstance(get_data.get("ingredient_id"), type(None))
            else get_data.get("ingredient_id")
        )
        order_by = (
            None
            if isinstance(get_data.get("order_by"), type(None))
            else get_data.get("order_by")
        )
        order_direction = {
            "ASCENDING": "ASCENDING",
            "DESCENDING": "DESCENDING",
            None: None,
            "asc": "ASCENDING",
            "desc": "DESCENDING",
        }[get_data.get("order_direction")]
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
            "ingredient_id": ingredient_id,
            "order_by": order_by,
            "order_direction": order_direction,
            "from_date": from_date,
            "to_date": to_date,
            "limit": limit,
        }
    except (ValueError, TypeError, KeyError) as e:
        logger.error(str(e))
        return False


def validate_post_data_set(post_data):
    try:
        income_list = post_data.get("income_list")
        if isinstance(income_list, list):
            if len(income_list) == 0:
                return True
            for each in income_list:
                if isinstance(each, dict):
                    if not (
                        each.get("ingredient_id")
                        and int(each.get("ingredient_amount"))
                        and each.get("direction")
                    ):
                        return False

        new_items_list = post_data.get("new_items_list")
        if isinstance(new_items_list, list):
            if len(new_items_list) == 0:
                return True
            for each in new_items_list:
                if isinstance(each, dict):
                    if not (
                        each.get("ingredient_name")
                        and int(each.get("ingredient_amount"))
                        and int(each.get("ingredient_min_amount"))
                        and each.get("unit")
                        and each.get("tags")
                    ):
                        return False
        return True
    except (ValueError, TypeError) as e:
        logger.error(str(e))
        return False


def validate_post_data_update(post_data):
    try:
        return (
            isinstance(post_data.get("ingredient_id"), str)
            and isinstance(post_data.get("ingredient_name"), str)
            and isinstance(post_data.get("min_amount"), str)
            and int(post_data.get("min_amount"))
            and isinstance(post_data.get("unit"), str)
            and isinstance(post_data.get("tags"), list)
        )
    except (ValueError, TypeError) as e:
        logger.error(str(e))
        return False


def set_storage_income(post_data, author):
    bad_data = []
    almost_empty = []
    for single_income in post_data.get("income_list"):
        try:
            transaction_result = Transaction.update_storage_item_amount(
                ingredient_id=single_income.get("ingredient_id"),
                ingredient_amount=int(single_income.get("ingredient_amount")),
                direction=single_income.get("direction"),
                author=author,
            )
            if isinstance(transaction_result, bool) and transaction_result is False:
                bad_data.append(single_income)
            elif isinstance(transaction_result, tuple):
                almost_empty.append(
                    {
                        "ingredient_id": single_income.get("ingredient_id"),
                        "amount": transaction_result[0],
                        "min_amount": transaction_result[1],
                    }
                )
        except ValueError:
            bad_data.append(single_income)

    for new_item in post_data.get("new_items_list"):
        try:
            transaction_result = Transaction.set_new_storage_item(
                ingredient_name=new_item.get("ingredient_name"),
                ingredient_amount=int(new_item.get("ingredient_amount")),
                ingredient_min_amount=int(new_item.get("ingredient_min_amount")),
                unit=new_item.get("unit"),
                tags=new_item.get("tags"),
                author=author,
            )
            if isinstance(transaction_result, bool) and transaction_result is False:
                bad_data.append(new_item)
        except ValueError:
            bad_data.append(new_item)

    ans = {}
    if bad_data:
        ans["bad_data"] = bad_data
    if almost_empty:
        ans["almost_empty"] = almost_empty

    return (False if bad_data else True, ans if ans else None)

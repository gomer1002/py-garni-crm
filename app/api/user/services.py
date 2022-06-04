from app import logger
from app.models.right import Right


def validate_update_data(post_data):
    try:
        user_id = post_data.get("user_id")
        name = post_data.get("name")
        phone = post_data.get("phone")
        rights = post_data.get("rights")
        if (
            isinstance(user_id, str)
            and isinstance(name, str)
            and isinstance(phone, str)
            and isinstance(rights, list)
        ):
            actual_rights = Right.get_list()
            for each in rights:
                if each not in actual_rights:
                    return False
            return True
        return False
    except (ValueError, TypeError) as e:
        logger.error(str(e))
        return False

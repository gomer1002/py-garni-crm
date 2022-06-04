import tempfile

from app import logger
from app.models.menu import Menu
from werkzeug.utils import secure_filename
from app.models.image import StorageImage

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}


def validate_request_data(post_data: dict) -> bool:
    """Проверка полученных данных"""
    try:
        return (
            isinstance(post_data.get("item_id"), str)
            and isinstance(post_data.get("item_name"), str)
            and isinstance(post_data.get("price"), str)
            and float(post_data.get("price"))
            and isinstance(post_data.get("item_description"), str)
            and isinstance(post_data.get("available_to_order"), bool)
            and isinstance(post_data.get("show"), bool)
            and isinstance(post_data.get("img_urls"), list)
            and isinstance(post_data.get("composition"), list)
            and isinstance(post_data.get("portion_weight"), str)
            and int(post_data.get("portion_weight"))
            and isinstance(post_data.get("portion_calories"), str)
            and int(post_data.get("portion_calories"))
            and len(post_data.get("img_urls")) != 0
            and isinstance(post_data.get("tags"), list)
            and len(post_data.get("tags")) != 0
            and isinstance(post_data.get("category"), str)
        )
    except (ValueError, TypeError) as e:
        logger.error(str(e))
        return False


def update_menu_item_service(post_data: dict) -> bool:
    return Menu(
        item_id=post_data.get("item_id"),
        item_name=post_data.get("item_name"),
        item_description=post_data.get("item_description"),
        price=float(post_data.get("price")),
        available_to_order=post_data.get("available_to_order"),
        show=post_data.get("show"),
        img_urls=post_data.get("img_urls"),
        composition=[
            {"amount": int(e.get("amount")), "ingredient_id": e.get("ingredient_id")}
            for e in post_data.get("composition")
        ],
        portion_weight=int(post_data.get("portion_weight")),
        portion_calories=int(post_data.get("portion_calories")),
        tags=post_data.get("tags"),
        category=post_data.get("category"),
    ).save()


def allowed_file(filename):
    """Проверка расширения файла"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_files(file_list: list) -> dict:
    """Загрузка файлов в хранилище и получение списка ссылок на файлы"""
    ans = []
    print("INPUT FILE LIST", file_list)
    for file in file_list:
        print("EACH FILE", file)
        if file and allowed_file(file.filename):
            # делаем файл безопасным
            sys_filename = secure_filename(file.filename)
            # print(f"file on server {sys_filename}")

            # создаем временное хранилище и сохраняем файл туда
            temp = tempfile.NamedTemporaryFile(delete=False)
            file.save(temp.name)

            # загружаем файл в хранилище
            sys_link = StorageImage.store(file=temp.name, filename=sys_filename)
            ans.append(sys_link)
    return ans


def delete_menu_image(image_name):
    del_result = StorageImage.delete(image_name)
    return del_result


def get_menu_images_list():
    return StorageImage.get_list()


def get_menu_json():
    return Menu.get()

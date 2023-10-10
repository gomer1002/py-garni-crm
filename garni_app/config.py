import os
import json
from os.path import join
from datetime import timedelta

base_dir = os.path.abspath(os.path.dirname(__file__))
config_dir = join(base_dir, "config")


class BaseConfig:
    """
    Base application configuration
    """

    # отключение сортировки json объектов
    JSON_SORT_KEYS = False

    # корневая ссылка на приложение
    SYS_ROOT_URL = "https://garni-24.iambokushin.ru"

    DEBUG = False

    # ключи для работы push уведомлений
    DER_BASE64_ENCODED_PRIVATE_KEY = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgCm6hSTzbQMHrJn/TkV0UlEkjLK5GIFL5tUf0OJIP17KhRANCAAQPxJVBVTQxL7avbSC9CRixOD1NVr+6XMPx2osmxR93VZN1MXkR7R0NeWD9SZjul00OkI0L//065FZB4Ik4EV6G"
    DER_BASE64_ENCODED_PUBLIC_KEY = "BA_ElUFVNDEvtq9tIL0JGLE4PU1Wv7pcw_HaiybFH3dVk3UxeRHtHQ15YP1JmO6XTQ6QjQv__TrkVkHgiTgRXoY"

    # настройки для работы с firebase
    FIREBASE_DATABASE = {
        "apiKey": "AIzaSyDpb8OZlqWpNJV0Nk3BScVWjhsRHjOr_wY",
        "authDomain": "py-garni-crm.firebaseapp.com",
        "databaseURL": "https://py-garni-crm-default-rtdb.firebaseio.com",
        "projectId": "py-garni-crm",
        "storageBucket": "py-garni-crm.appspot.com",
        "messagingSenderId": "562625329322",
        "appId": "1:562625329322:web:aca600fa14c21b99ef38d3",
        "measurementId": "G-CE8WDRGVH3",
        "serviceAccount": {
            "type": "service_account",
            "project_id": "py-garni-crm",
            "private_key_id": "d260ab1ad46b63df0c4ab535ec053b49d3ebe05e",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCRUWhCo5V1Rcj0\nBIfWRYOtiegWwyj9h+QHuud0AcH57cXgvBJZ3qvzLlnOPniVHvQCaYfYcFcg2wtk\nkvBNhftbLkS8Cmjw+pwp7n6/v5NL5Q2HcE9HlMSi2I0LXvJwzoOilvvy2r0wE+Vk\nIbD1O/4ss8TzLeiQAZJinSAEQ7xQbX5MqhZJbyTtUGAAohkyx04Pe2LRfzxpYnGL\nUsUS0uZjd7hdlQDhaM4i9gaeVi5mEuIc/ZFQYVjPo6WezQPDnP9fYYd0ux++b7/y\nZdZkVVWSBuEvZSDycRbsBZfxHbQrrBnfIT0tNIr5LPKm0z3BxEMk1xnRcugHQaSJ\nWNQw7ur5AgMBAAECggEAHagujgMSmodudpaCHnG7aOxPKG4V7IASQp2bZOqC6v3i\nt3XKjPrLvuqDu3q2Y0CY7fEZn0t2DKeHkLQIRNoGLVqo/nNlbWDIBCq/RWTUq9WI\nSE7cbzBmXRGy31I2Sl1rMgB8VNjdaXV2CFRz5+ihfAAIPtTstI8NkACfKx+jzAnt\nzzyWhCvCSIbA2Rvy6vc6Xlw+ryrZmdoEKl6yVua1y1USF7sVLQv/cGAUy1TOUtGO\n7169S2U3UWeQcjp2dec6Utn90HRgcX6oiBqbI0BGh40EnNflIG6xBhzl4loxbORK\n49w8FVqInRzTEIUubfGEX2u+x1aqe9bK1jCuDnvjjQKBgQDFyvJ/fUdappQS5CWY\nGVoZu0bxINp4lK/V2b0pyb6eeoVgK3ulc1MbYI6Hsy4kEHRp8iUAxDZR1qBKq/WT\nRLC0/CLFPKbtMAlpSd0MmlaekBm2h8OL9IY7LU5mF+4T11MgQUtJtR/dIL3+XnGQ\nXFz7Kp7I0bCXAYcobLp0T8Dl1wKBgQC8FS9HAbRT7VS+4hfw9MoavxJpeJJgLHGR\nynM8gs4Zg2kZ6tY3FJASQwQxeDBfeijvKcyqdfSny7rMNH6APbzMp342/Bvptg5o\ncbHvXSzT6ZugVNIt9DeBj2cOCET4yzapL8IVqUwqx7wa3N3Nak3qE6yW1woTkp00\n31JnBAj7rwKBgDixmFqkrSw1rSHRFVmIgsP3YzlAgn6nl9MDS25L7oB8e/h53kIp\nUTv6rEAHQwWBVez8RFD47Nz+WQmuSoDA4qmtz8WbQfmgmEH+swamwodGpKgmOA3I\ntCUIMn2fBFXZlXEcZhklepGmje74YTLQ1rIDoGnNeQF/pZ8Xs0YdihwXAoGABvTh\nosa1XMVSdRz3tbnYH9UhYTVMdLIwISxTxtEvvlHV+VduROtFyOchqJLBd0aVbQMm\nxsdGHU6zwgnPA/9ElG09hdsdTS+mqMZLxoazucLSNsPsYja+NtSPAz3bDzi09N0H\nWLXCU3K/yl6Q9aAQ8a94mrupa7/ogKQh8B1+F5ECgYEAntSJs+0G7003CbXj29M+\npq0AO9lk0cFLRxQ5lsmSaTLFOw/aUd31tCw1bC5kPB3ovbcYwZX9e86+lW4Hv0ON\n5zf6y42TXu0k3+qLiKYHoV0XuvlhVjhIUfJDNlFsnahgQv4mjrdRuqbVyhHgC6zJ\nafT0TMjFCkDxl1KyUyOM7Wg=\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-jzyol@py-garni-crm.iam.gserviceaccount.com",
            "client_id": "111010391940327521568",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-jzyol%40py-garni-crm.iam.gserviceaccount.com",
        },
    }

    # system pepper
    PEPPER = "81c43252b9901956f0c8b980f89c66d9af4bf1cfe827034cb7a7bdd11093147f"

    # настройки JWT
    JWT_SECRET_KEY = "AIzaSyDpb8OZlqWpNJV0Nk3BScVWjhsRHjOr_wYd260ab1ad46b63df0c4ab535ec053b49d3ebe05e"
    JWT_COOKIE_SECURE = False
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_CSRF_METHODS = []


class DevelopmentConfig(BaseConfig):
    """
    Development application configuration
    """

    DEBUG = True


class TestingConfig(BaseConfig):
    """
    Testing application configuration
    """

    DEBUG = True
    TESTING = True


class ProductionConfig(BaseConfig):
    """
    Production application configuration
    """

    DEBUG = False
    JWT_COOKIE_SECURE = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

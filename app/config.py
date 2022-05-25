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
    SYS_ROOT_URL = os.getenv("SYS_ROOT_URL")

    DEBUG = False
    BCRYPT_HASH_PREFIX = 14
    # AUTH_TOKEN_EXPIRY_DAYS = 30
    # AUTH_TOKEN_EXPIRY_SECONDS = 3000

    # ключи для работы push уведомлений
    DER_BASE64_ENCODED_PRIVATE_KEY = os.getenv("DER_BASE64_ENCODED_PRIVATE_KEY")
    DER_BASE64_ENCODED_PUBLIC_KEY = os.getenv("DER_BASE64_ENCODED_PUBLIC_KEY")

    # настройки для работы с firebase
    FIREBASE_DATABASE = json.loads(os.getenv("FIREBASE_DATABASE"))

    # system pepper
    PEPPER = os.getenv("SYS_PEPPER", "super_secret_key")

    # настройки JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
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
    # BCRYPT_HASH_PREFIX = 4
    # AUTH_TOKEN_EXPIRY_DAYS = 0
    # AUTH_TOKEN_EXPIRY_SECONDS = 60


class TestingConfig(BaseConfig):
    """
    Testing application configuration
    """

    DEBUG = True
    TESTING = True
    # BCRYPT_HASH_PREFIX = 4
    # AUTH_TOKEN_EXPIRY_DAYS = 0
    # AUTH_TOKEN_EXPIRY_SECONDS = 3
    # AUTH_TOKEN_EXPIRATION_TIME_DURING_TESTS = 5


class ProductionConfig(BaseConfig):
    """
    Production application configuration
    """

    DEBUG = False
    JWT_COOKIE_SECURE = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    # BCRYPT_HASH_PREFIX = 13
    # AUTH_TOKEN_EXPIRY_DAYS = 30
    # AUTH_TOKEN_EXPIRY_SECONDS = 20

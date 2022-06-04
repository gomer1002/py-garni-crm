import os
from flask import Flask
from firebase_admin import credentials, initialize_app
from flask_jwt_extended import JWTManager
import redis
from loguru import logger

# Initialize application
app = Flask(__name__, static_folder=None)

# app configuration
app_settings = os.getenv("APP_SETTINGS", "app.config.DevelopmentConfig")
app.config.from_object(app_settings)

# redis configuration
jwt = JWTManager(app)
jwt_redis_blocklist = redis.from_url(os.environ.get("REDIS_URL"))

# firebase configuration
cred = credentials.Certificate(app.config.get("FIREBASE_DATABASE")["serviceAccount"])
initialize_app(cred, app.config.get("FIREBASE_DATABASE"))

##### client side blueprints #####

########### client ###############
# здесь находится client main html
from app.client.views import client

app.register_blueprint(client)

########### client ###############
#
#
#
############# api ################

##### server side blueprints #####

# Import the application views
from app import views

# здесь будет api/auth системы
from app.api.auth.views import auth

app.register_blueprint(auth)

# здесь будет api/menu системы
from app.api.menu.views import menu

app.register_blueprint(menu)

# здесь будет api/order системы
from app.api.order.views import order

app.register_blueprint(order)

# здесь будет api/storage системы
from app.api.storage.views import storage

app.register_blueprint(storage)

# здесь будет api/user системы
from app.api.user.views import user

app.register_blueprint(user)

# здесь будет api/push системы
from app.api.push.views import push

app.register_blueprint(push)

############# api ################

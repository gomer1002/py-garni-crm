from app import app
from app import jwt
from app import jwt_redis_blocklist
from app.services import response


@app.errorhandler(404)
def route_not_found(e):
    """
    Return a custom 404 Http response message for missing or not found routes.
    :param e: Exception
    :return: Http Response
    """
    return response("failed", "Endpoint not found", 404)


@app.errorhandler(405)
def method_not_found(e):
    """
    Custom response for methods not allowed for the requested URLs
    :param e: Exception
    :return:
    """
    return response("failed", "The method is not allowed for the requested URL", 405)


@app.errorhandler(500)
def internal_server_error(e):
    """
    Return a custom message for a 500 internal error
    :param e: Exception
    :return:
    """
    return response("failed", "Internal server error", 500)


@jwt.unauthorized_loader
def my_expired_token_callback(jwt_payload):
    return response("failed", "Для доступа необходимо авторизоваться в системе", 401)


@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token_in_redis = jwt_redis_blocklist.get(jti)
    return token_in_redis is not None


@jwt.revoked_token_loader
def response_if_token_is_revoked(jwt_header, jwt_payload):
    return response("failed", "Token has been revoked but custom msg", 401)

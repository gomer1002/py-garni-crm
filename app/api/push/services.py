import json
from app import app
from app import logger
from app.models.user import User
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = app.config.get("DER_BASE64_ENCODED_PRIVATE_KEY")
VAPID_CLAIMS = {
    "sub": "mailto:chubaka1002@gmail.com",
    # "aud": "https://garni-24.ru:8000",
}


def subscribe_user(token, user_id):
    user = User.get_by_id(user_id=user_id)
    push_data = user[user_id].get("push_data")
    if isinstance(push_data, list):
        if token not in push_data:
            push_data.append(token)
    else:
        push_data = [token]
    return User.update({"user_id": user_id, "push_data": push_data})


def unsubscribe_user(user_id):
    return User.update({"user_id": user_id, "push_data": []})


def get_token_list(user_id):
    return User.get_by_id(user_id=user_id).get(user_id).get("push_data")


def send_web_push(user_id: str, message_data: str | dict):
    token_list = get_token_list(user_id=user_id)
    answer_list = []
    if isinstance(token_list, list):
        for token in token_list:
            try:
                print("SUB INFO", token)
                print("MESSAGE BODY", json.dumps(message_data))
                response = webpush(
                    subscription_info=token,
                    data=json.dumps(message_data),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS,
                )
                print("PUSH RESPONSE", response)
                answer_list.append(response.ok)
            except WebPushException as e:
                if e.response and e.response.json():
                    extra = e.response.json()
                    print(
                        "Remote service replied with a {}:{}, {}",
                        extra.code,
                        extra.errno,
                        extra.message,
                    )
                logger.error(str(e))
                answer_list.append(False)
        print("WEB PUSH ANSWER LIST", answer_list)

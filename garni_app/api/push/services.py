import json
from garni_app.garni_app import app
from garni_app.garni_app import logger
from garni_app.models.user import User
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = app.config.get("DER_BASE64_ENCODED_PRIVATE_KEY")


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
    valid_tokens = []
    if isinstance(token_list, list):
        for token in token_list:
            try:
                # print("SUB INFO", type(token), token)
                # print("MESSAGE BODY", json.dumps(message_data))
                response = webpush(
                    subscription_info=token,
                    data=json.dumps(message_data),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": "mailto:chubaka1002@gmail.com"},
                )
                print("PUSH RESPONSE", response.status_code)
                valid_tokens.append(token)
            except WebPushException as e:
                pass
                # print(e.response.status_code)
                msg = e.response.text
                if "{" in e.response.text:
                    msg = json.loads(e.response.text)["message"]
                logger.error(f"{e.response.status_code}:{msg}")
                # answer_list.append(False)
        # print("WEB PUSH ANSWER LIST", answer_list)
        User(user_id=user_id, rights=False, push_data=valid_tokens).save()

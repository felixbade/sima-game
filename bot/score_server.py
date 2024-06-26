import os

import requests
from aiohttp import web
from dotenv import load_dotenv
import jwt
from jwt.exceptions import DecodeError, ExpiredSignatureError

# Load environment variables from .env file
load_dotenv()

# Access variables
tg_token = os.getenv('TG_TOKEN')
jwt_secret_key = os.getenv('JWT_SECRET_KEY')
port = int(os.getenv('PORT'))
tg_notification_group_id = os.getenv('TG_NOTIFICATION_GROUP_ID')


def set_telegram_game_score(bot_token, payload):
    method_url = f"https://api.telegram.org/bot{bot_token}/setGameScore"
    response = requests.post(method_url, data=payload)
    return response.json()  # or handle response as needed


def send_message(bot_token, chat_id, text):
    method_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text
    }
    response = requests.post(method_url, data=payload)
    return response.json()  # or handle response as needed


async def submit_highscore(request):
    try:
        data = await request.json()
        score = data.get('score')
        token = data.get('token')

        decoded_data = jwt.decode(token, jwt_secret_key, algorithms=['HS256'])
        user_id = decoded_data['user_id']

        if 'inline_message_id' in decoded_data:
            inline_message_id = decoded_data['inline_message_id']
            payload = {
                'user_id': user_id,
                'inline_message_id': inline_message_id,
                'score': int(score)
            }
        else:
            chat_id = decoded_data['chat_id']
            message_id = decoded_data['message_id']
            payload = {
                'user_id': user_id,
                'chat_id': chat_id,
                'message_id': message_id,
                'score': int(score)
            }

        set_telegram_game_score(tg_token, payload)

        name = f'User user_id'
        if 'first_name' in decoded_data:
            name = decoded_data['first_name']
            if 'last_name' in decoded_data:
                name += ' ' + decoded_data['last_name']
        send_message(tg_token, tg_notification_group_id,
                     f'{name} got {score} points.')

        return web.Response(text='Highscore submitted successfully.', status=200)

    except (DecodeError, ExpiredSignatureError) as e:
        # Invalid token or token has expired
        return web.Response(text=str(e), status=401)
    except Exception as e:
        # Other errors
        return web.Response(text=str(e), status=500)


app = web.Application()
app.router.add_post('/submit_highscore', submit_highscore)


def start_server():
    # Start the aiohttp web server
    web.run_app(app, host='localhost', port=port)


if __name__ == '__main__':
    start_server()

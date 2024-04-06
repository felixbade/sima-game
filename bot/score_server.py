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


def set_telegram_game_score(bot_token, user_id, inline_message_id, score):
    method_url = f"https://api.telegram.org/bot{bot_token}/setGameScore"
    payload = {
        'user_id': user_id,
        'inline_message_id': inline_message_id,
        'score': int(score)
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
        inline_message_id = decoded_data['inline_message_id']

        set_telegram_game_score(tg_token, user_id, inline_message_id, score)

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

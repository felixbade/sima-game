import os
from datetime import timedelta, datetime

from dotenv import load_dotenv
import jwt
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# Load environment variables from .env file
load_dotenv()

# Access variables
tg_token = os.getenv('TG_TOKEN')
jwt_secret_key = os.getenv('JWT_SECRET_KEY')

# Initialize the Application using the token
application = ApplicationBuilder().token(tg_token).build()


async def start(update, context):
    keyboard = [[InlineKeyboardButton("Play Sima", callback_game=True)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await context.bot.send_game(chat_id=update.effective_chat.id,
                                game_short_name='sima', reply_markup=reply_markup)


async def button(update, context):
    query = update.callback_query
    user_id = query.from_user.id
    # chat_id = query.message.chat_id
    inline_message_id = query.inline_message_id

    # Create a JWT token with a short expiration time for security
    token_data = {
        'user_id': user_id,
        'inline_message_id': inline_message_id,
        'exp': datetime.utcnow() + timedelta(minutes=60)
    }
    token = jwt.encode(token_data, jwt_secret_key, algorithm='HS256')

    url = f'https://sima.bloat.app/?token={token}'
    await query.answer(url=url)

application.add_handler(CommandHandler('start', start))
application.add_handler(CallbackQueryHandler(button))


# Run the bot until the user presses Ctrl-C
application.run_polling()

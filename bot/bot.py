from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Access variables
tg_token = os.getenv('TG_TOKEN')

# Initialize the Application using the token
application = ApplicationBuilder().token(tg_token).build()


async def start(update, context):
    keyboard = [[InlineKeyboardButton("Play Sima", callback_game=True)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await context.bot.send_game(chat_id=update.effective_chat.id,
                                game_short_name='sima', reply_markup=reply_markup)


async def button(update, context):
    query = update.callback_query
    await query.answer(url='https://sima.bloat.app/')


application.add_handler(CommandHandler('start', start))
application.add_handler(CallbackQueryHandler(button))


# Run the bot until the user presses Ctrl-C
application.run_polling()

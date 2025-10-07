require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('ERROR: BOT_TOKEN is not set. Create a .env file based on .env.example and set BOT_TOKEN.');
    process.exit(1);
}

const bot = new Telegraf(token);

const welcomeVideoPath = path.join(__dirname, 'assets', 'welcome.mp4');

// Set bot commands (visible in the Telegram menu)
bot.telegram.setMyCommands([
    { command: 'start', description: 'Запуск приветствия' },
    { command: 'help', description: 'Помощь' },
    { command: 'consult', description: 'Записаться на консультацию' },
    { command: 'constellation', description: 'Записаться на расстановку' }
]).catch(() => { });

bot.start(async (ctx) => {
    try {
        const user = ctx.from;
        const name = user.username ? `@${user.username}` : (user.first_name || 'друг');

        // Greeting text
        const welcomeText = `Привет, ${name}! Рада видеть тебя. Ниже — короткое приветственное видео и информация.`;

        // Persistent reply keyboard (visible always)
        const replyKeyboard = Markup.keyboard([
            ['Задать вопрос'],
            ['Записаться на консультацию', 'Записаться на расстановку']
        ]).resize();

        // Send welcome text first with persistent keyboard
        await ctx.reply(welcomeText, replyKeyboard);

        // Send welcome video if exists — если нет, просто ничего не отправляем кроме текста
        if (fs.existsSync(welcomeVideoPath)) {
            await ctx.replyWithVideo({ source: fs.createReadStream(welcomeVideoPath) }, { caption: 'Приветственное видео' });
        }

    } catch (err) {
        console.error('Error in start handler:', err);
        await ctx.reply('Произошла ошибка при отправке приветствия. Попробуйте позже.');
    }
});

// Handlers for buttons

// Handle reply-keyboard presses using hears
bot.hears('Задать вопрос', async (ctx) => {
    await ctx.reply('Напишите ваш вопрос в этом чате, и мы постараемся ответить.');
});

bot.hears('Записаться на консультацию', async (ctx) => {
    await ctx.reply('Отлично — вы выбрали консультацию. Пожалуйста, оставьте контакт и удобное время.');
});

bot.hears('Записаться на расстановку', async (ctx) => {
    await ctx.reply('Спасибо — вы выбрали расстановку. Оставьте контактные данные, и мы свяжемся с вами.');
});

// Fallback for text messages after pressing 'ask question'
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    // Very simple heuristic: if user wrote a question after initial buttons
    if (text && text.length > 0) {
        // Here you can implement saving to DB or forwarding to admin
        await ctx.reply('Спасибо! Ваше сообщение получено. Мы ответим в ближайшее время.');
    }
});

// Launch bot
bot.launch().then(() => console.log('Bot started')).catch(err => {
    console.error('Failed to launch bot:', err);
    process.exit(1);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

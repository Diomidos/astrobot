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

// Example: editable list of available dates (ISO strings or human-readable)
// You (the owner) can modify this array to control availability.
const AVAILABLE_DATES = [
    '15.10.2025',
    '18.10.2025',
    '22.10.2025'
];

function buildCalendarKeyboard(dates, type = 'consult') {
    // Build inline keyboard: first row - close button
    const rows = [];
    rows.push([Markup.button.callback('✖️', 'close_calendar')]);

    // Each date as a separate button
    dates.forEach(d => {
        // Use action 'book_<type>_<date>' safe for callbacks
        const safeDate = d.replace(/[^0-9a-zA-Z.-]/g, '_');
        const action = `book_${type}_${safeDate}`;
        rows.push([Markup.button.callback(d, action)]);
    });

    return Markup.inlineKeyboard(rows);
}

// const welcomeVideoPath = path.join(__dirname, 'assets', 'welcome.mp4');

// Меню кнопок телеграмм (visible in the Telegram menu)
// bot.telegram.setMyCommands([
//     { command: 'start', description: 'Запуск Бота ' },
//     { command: 'help', description: 'Помощь' },
//     { command: 'consult', description: 'Записаться на консультацию' },
//     { command: 'constellation', description: 'Записаться на расстановку' }
// ]).catch(() => { });

bot.start(async (ctx) => {
    try {
        const user = ctx.from;
        const name = user.username ? `@${user.username}` : (user.first_name || 'друг');

        // Greeting text
        const welcomeText = `Здравствуй, ${name}! Здесь ты найдешь ответы на свои вопросы.
Для того, чтобы понять твое это поле или нет, нужно пообщаться. Достаточно 15 минут, чтобы почувствовать человека.
Если тебе это нужно, выбери  "Знакомство - Общение"
Когда же ты с уверенностью готов к индивидуальной расстановке, выбирай "Запись на расстановку". Она может проходить в двух форматах:
Индивидуальная, тет а тет
И
Групповая, с участием заместителей

С уважением 
Регина Привозина, расстановщик, психолог, мастер подсознания.`;

        // Inline keyboard (buttons attached to the message so they always visible)
        const inlineMenu = Markup.inlineKeyboard([
            [Markup.button.callback('Рассылка анонсов ближайших встреч', 'open_broadcast')],
            [Markup.button.callback('Записаться на консультацию', 'open_consult')],
            [Markup.button.callback('Записаться на расстановку', 'open_constellation')]
        ]);

        // Send welcome text first with inline menu
        await ctx.reply(welcomeText, inlineMenu);

        // Send welcome video if exists — если нет, просто ничего не отправляем кроме текста
        // if (fs.existsSync(welcomeVideoPath)) {
        //     await ctx.replyWithVideo({ source: fs.createReadStream(welcomeVideoPath) }, { caption: 'Приветственное видео' });
        // }

    } catch (err) {
        console.error('Error in start handler:', err);
        await ctx.reply('Произошла ошибка при отправке приветствия. Попробуйте позже.');
    }
});

// Handlers for buttons

// Handle reply-keyboard presses using hears
// removed reply-keyboard dependent hears handler for broadcast

// Actions for broadcast
bot.action('broadcast_yes', async (ctx) => {
    await ctx.answerCbQuery();
    const schedulePath = path.join(__dirname, 'assets', 'schedule.txt');
    if (fs.existsSync(schedulePath)) {
        const filename = path.basename(schedulePath);
        await ctx.replyWithDocument({ source: fs.createReadStream(schedulePath), filename }, { caption: 'Расписание ближайших встреч' });
    } else {
        await ctx.reply('Файл с расписанием недоступен. Попробуйте позже.');
    }
});

bot.action('broadcast_no', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Если передумаете, нажмите на кнопку "Рассылка анонсов ближайших встреч"');
});

// removed reply-keyboard dependent hears handler for consult; will use inline actions below

// Add actions triggered by inline menu buttons
bot.action('open_broadcast', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Желаете получать анонсы ближайших встреч?', Markup.inlineKeyboard([
        Markup.button.callback('ДА', 'broadcast_yes'),
        Markup.button.callback('НЕТ', 'broadcast_no')
    ]));
});

bot.action('open_consult', async (ctx) => {
    await ctx.answerCbQuery();
    const keyboard = buildCalendarKeyboard(AVAILABLE_DATES, 'consult');
    await ctx.reply('Доступные даты:\nВыберите удобную дату для консультации:', keyboard);
});

bot.action('open_constellation', async (ctx) => {
    await ctx.answerCbQuery();
    const keyboard = buildCalendarKeyboard(AVAILABLE_DATES, 'constellation');
    await ctx.reply('Доступные даты:\nВыберите удобную дату для расстановки:', keyboard);
});

// Close calendar
bot.action('close_calendar', async (ctx) => {
    await ctx.answerCbQuery();
    // remove inline keyboard by editing message reply markup
    try {
        await ctx.editMessageReplyMarkup();
    } catch (e) {
        // If edit fails (message too old), just send a small message
        await ctx.reply('Календарь закрыт');
    }
});

// Booking handler for dates — pattern book_<type>_<date>
bot.action(/book_(consult|constellation)_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const match = ctx.match; // telegraf populates match for regex actions
    const type = match[1];
    const date = match[2];
    const user = ctx.from;
    const name = user.username ? `@${user.username}` : (user.first_name || 'друг');

    // Close calendar UI
    try {
        await ctx.editMessageReplyMarkup();
    } catch (e) {
        // ignore
    }

    // Confirm booking to user with correct wording
    if (type === 'consult') {
        await ctx.reply(`${name}, Вы записались на консультацию ${date}`);
    } else {
        await ctx.reply(`${name}, Вы записались на расстановку ${date}`);
    }
    // TODO: here you may want to persist booking to DB or notify admin
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

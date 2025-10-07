# AstroBot — Telegram welcome bot

Короткая инструкция по запуску бота.

1. Скопируйте `.env.example` в `.env` и заполните `BOT_TOKEN`.
2. Положите приветственное видео `welcome.mp4` в папку `assets/`.
3. Установите зависимости (если ещё не установлены):

```powershell
npm install
```

4. Запустите бота в PowerShell:

```powershell
node index.js
```

Примечание: убедитесь, что в `.env` указан корректный `BOT_TOKEN` от BotFather.

Файлы:

- `index.js` — основной код бота
- `assets/welcome.mp4` — приветственное видео (не включено в репозиторий)

# Сэр Ниар — проверяемо приватный голосовой помощник для сайтов

Подробное описание для судей — в [README.md](README.md) (на английском). Здесь кратко и про запуск.

## Что это

Голосовой помощник с живым 3D-персонажем, которого бизнес (клиника, банк, юристы) ставит на свой сайт одной строкой. Посетитель говорит голосом или показывает документ, помощник отвечает вслух. Вся цепочка работает в защищённых аппаратных средах (TEE): наш сервер — на Phala Cloud, шлюз и модели — в NEAR AI Cloud. Помощник показывает доказательство кнопкой «TEE ✓», сайт бизнеса разговор не видит, сервер ничего не хранит.

Демо: `/demo/clinic.html` — вымышленная клиника с помощником в углу.

## Запуск у себя

```bash
cp .env.example .env      # вписать NEAR_AI_KEY
npm install
npm run verify            # одна проверка: ответ модели + аттестация + подпись
npm start                 # http://localhost:3000
```

## Хостинг

- **Northflank (разработка):** сервис из GitHub-репозитория, сборка по `Dockerfile`, переменные `NEAR_AI_KEY` и `DEV_KEY`. Голос на сервере: Build arguments → `WITH_VOICE=1`.
- **Phala Cloud (в TEE):** GitHub Actions собирает образ `ghcr.io/buterbro-cell/knight-site`; в Phala → Deploy → Docker Compose вставить `docker-compose.phala.yml`, в Encrypted Secrets задать `NEAR_AI_KEY` и `DEV_KEY`. После каждого изменения кода — новый отпечаток образа в строке `image:`.

## Новый бизнес

Скопируйте `public/biz/clinic.json`, поменяйте `id`, название, приветствие, документы и инструкции. Строка для сайта:

```html
<script src="https://<адрес-помощника>/widget.js" data-biz="ваш-id" data-lang="ru" async></script>
```

## Файлы

- `server.js` — API, потоковые ответы, проверки, Whisper, ничего не хранит
- `lib/attest.js`, `lib/selfattest.js` — аттестация NEAR AI и нашего сервера
- `public/index.html`, `public/app.js`, `public/app.css` — помощник; `public/knight3d.js` — 3D-рыцарь
- `public/widget.js` — встраивание на сайт; `public/biz/` — профили бизнесов; `public/demo/` — демо-клиника
- `docs/face-template.png` — шаблон для рисования глаз и рта

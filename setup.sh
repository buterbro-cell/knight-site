#!/usr/bin/env bash
# Установка и запуск говорящего рыцаря одной командой:
#   bash setup.sh ВАШ_КЛЮЧ_NEAR_AI
# Повторный запуск безопасен: обновит и перезапустит рыцаря.
set -e
KEY="$1"
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3080}"   # не 3000, чтобы не мешать другим программам на сервере

if [ -z "$KEY" ]; then
  echo "❌ Нужен ключ NEAR AI. Запустите так:  bash setup.sh ВАШ_КЛЮЧ"
  exit 1
fi
cd "$DIR"

echo "▶ 1/5 Проверяю Node.js..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi
echo "   Node.js $(node -v)"

echo "▶ 2/5 Проверяю pm2 (держит рыцаря включённым)..."
command -v pm2 >/dev/null 2>&1 || npm install -g pm2 >/dev/null 2>&1

echo "▶ 3/5 Запускаю рыцаря..."
pm2 delete knight >/dev/null 2>&1 || true
NEAR_AI_KEY="$KEY" TRUST_PROXY=1 PORT="$PORT" pm2 start server.js --name knight --update-env >/dev/null
sleep 2

echo "▶ 4/5 Проверяю ключ NEAR AI (задаю рыцарю вопрос)..."
ANSWER=$(curl -s -X POST "http://localhost:$PORT/api/chat" -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Привет! Ответь одним коротким предложением."}]}')
if echo "$ANSWER" | grep -q '"answer"'; then
  echo "   ✅ Рыцарь ответил: $ANSWER"
else
  echo "   ⚠️ Нейросеть не ответила: $ANSWER"
  echo "   Последние строки журнала:"
  pm2 logs knight --lines 5 --nostream 2>/dev/null | tail -5
  echo "   Пришлите этот экран в чат — разберёмся."
fi

echo "▶ 5/5 Делаю временную ссылку с HTTPS (нужна для микрофона)..."
if [ ! -x "$DIR/cloudflared" ]; then
  ARCH=$(uname -m); case "$ARCH" in aarch64|arm64) A=arm64;; *) A=amd64;; esac
  curl -fsSL -o "$DIR/cloudflared" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$A"
  chmod +x "$DIR/cloudflared"
fi
pm2 delete tunnel >/dev/null 2>&1 || true
pm2 start "$DIR/cloudflared" --name tunnel -- tunnel --no-autoupdate --url "http://localhost:$PORT" >/dev/null
pm2 save >/dev/null
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

URL=""
for i in $(seq 1 30); do
  URL=$(pm2 logs tunnel --lines 200 --nostream 2>/dev/null | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)
  [ -n "$URL" ] && break
  sleep 1
done

echo
if [ -n "$URL" ]; then
  echo "🎉 Готово! Откройте в Chrome на телефоне:"
  echo
  echo "   $URL"
  echo
  echo "Ссылка работает, даже если закрыть терминал. После перезагрузки сервера"
  echo "она поменяется — узнать новую:  bash $DIR/link.sh"
else
  echo "Рыцарь запущен, но ссылка пока не появилась. Через минуту выполните:  bash $DIR/link.sh"
fi

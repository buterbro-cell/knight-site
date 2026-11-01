#!/usr/bin/env bash
# Обновляет рыцаря до последней версии с GitHub
cd "$(dirname "$0")" && git pull && pm2 restart knight && echo "✅ Рыцарь обновлён"

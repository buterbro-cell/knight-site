#!/usr/bin/env bash
# Показывает текущую ссылку на рыцаря
URL=$(pm2 logs tunnel --lines 500 --nostream 2>/dev/null | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)
if [ -n "$URL" ]; then echo "Ссылка на рыцаря:  $URL"; else echo "Ссылки пока нет. Проверьте, что туннель запущен:  pm2 status"; fi

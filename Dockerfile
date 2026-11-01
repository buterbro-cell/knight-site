# Говорящий рыцарь NEAR — контейнер для Northflank (или любого Docker-хостинга)
FROM node:22-bookworm-slim

WORKDIR /app
# Libraries for attestation checks (Intel TDX quote verification, ECDSA signatures)
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .

# Голос на сервере (Piper) для браузеров без своего голоса, например Telegram.
# Нужно ~300 МБ памяти, поэтому по умолчанию выключено.
# Включить: в Northflank → Build options → Build arguments: WITH_VOICE = 1
ARG WITH_VOICE=0
RUN if [ "$WITH_VOICE" = "1" ]; then \
      apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
      mkdir -p piper && cd piper && \
      curl -fsSL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz | tar xz && \
      V=https://huggingface.co/rhasspy/piper-voices/resolve/main && \
      curl -fsSL -o ru.onnx      $V/ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx && \
      curl -fsSL -o ru.onnx.json $V/ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx.json && \
      curl -fsSL -o en.onnx      $V/en/en_US/ryan/medium/en_US-ryan-medium.onnx && \
      curl -fsSL -o en.onnx.json $V/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json && \
      rm -rf /var/lib/apt/lists/* ; \
    fi

ENV PORT=3000 TRUST_PROXY=1 NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "server.js"]

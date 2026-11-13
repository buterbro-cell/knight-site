# Говорящий рыцарь NEAR — контейнер для Northflank (или любого Docker-хостинга)
FROM node:22-bookworm-slim

WORKDIR /app
# Libraries for attestation checks (Intel TDX quote verification, ECDSA signatures)
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .

# Голос на сервере (Piper): один и тот же голос на всех устройствах, бесплатно, текст не уходит третьим лицам.
# Нужно ~300 МБ памяти, поэтому по умолчанию выключено.
# Включить: в Northflank → Build options → Build arguments: WITH_VOICE = 1
ARG WITH_VOICE=0
# English voice Ryan (medium) from Piper's own GitHub release (the current HuggingFace config crashes this Piper build).
# The build fails if the voice cannot say a test sentence.
RUN if [ "$WITH_VOICE" = "1" ]; then \
      apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
      mkdir -p piper && cd piper && \
      curl -fsSL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz | tar xz && \
      curl -fsSL https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-medium.tar.gz | tar xz && \
      mv en-us-ryan-medium.onnx en.onnx && mv en-us-ryan-medium.onnx.json en.onnx.json && rm -f MODEL_CARD && \
      echo "5625f6dd30d0fd793018f8636f073872bc8de5bea21198679f24187fa982b74e  en.onnx" | sha256sum -c - && \
      echo "Hello, I am SECRA." | ./piper/piper -m en.onnx -f /tmp/check.wav -q && test $(stat -c %s /tmp/check.wav) -gt 10000 && rm /tmp/check.wav && \
      rm -rf /var/lib/apt/lists/* ; \
    fi

# the only data at rest: encrypted standing orders (lib/dca.js); mount a volume here to keep them across re-creates
RUN mkdir -p /app/data && chown node:node /app/data
ENV PORT=3000 TRUST_PROXY=1 NODE_ENV=production DATA_DIR=/app/data
EXPOSE 3000
USER node
CMD ["node", "server.js"]

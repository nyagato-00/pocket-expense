FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
# 開発依存関係も含めてすべての依存関係をインストール
RUN npm install

COPY . .
# ビルド時にPrisma Clientを生成
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

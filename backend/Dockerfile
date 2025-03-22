FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# ビルド時にPrisma Clientを生成
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

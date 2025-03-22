FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# 開発依存関係も含めてすべての依存関係をインストール
RUN npm install

COPY . .

EXPOSE 3000
EXPOSE 6006

CMD ["npm", "run", "dev"]

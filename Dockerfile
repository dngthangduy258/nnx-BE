FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8787

# Lệnh chạy ứng dụng
CMD ["npm", "run", "dev"]

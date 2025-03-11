FROM node:23.9.0-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
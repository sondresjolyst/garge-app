FROM node:23.10.0-slim

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
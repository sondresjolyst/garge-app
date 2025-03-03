FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# ENV NODE_ENV=production

# RUN npm run build

EXPOSE 3000

# Start the application
CMD ["npm", "run" ,"dev"]
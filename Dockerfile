FROM node:18.15.0-alpine3.16

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY app/ .
COPY public/ public/

EXPOSE 80

ENTRYPOINT ["node", "index.js"]
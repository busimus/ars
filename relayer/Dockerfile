FROM node:20-alpine

RUN mkdir -p /relayer

WORKDIR /relayer

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

CMD ["node", "index.mjs"]

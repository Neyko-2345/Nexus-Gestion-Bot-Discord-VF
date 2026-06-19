FROM node:20-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y python3 build-essential

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]

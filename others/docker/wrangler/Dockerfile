FROM node:22.4.0
RUN npm install npm@10.8.1 -g
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
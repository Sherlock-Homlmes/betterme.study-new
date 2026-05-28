FROM node:22.4.0

RUN npm install npm@10.8.1 -g

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

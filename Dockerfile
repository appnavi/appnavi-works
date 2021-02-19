FROM node:14

RUN apt-get update || : && apt-get install python -y

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3000

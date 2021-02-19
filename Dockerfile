FROM node:15
ENV NODE_ENV=development

RUN apt-get update || : && apt-get install python -y

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3000

RUN yarn build

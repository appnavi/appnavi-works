FROM node:latest

RUN mkdir /app && chown node:node /app

WORKDIR /app

COPY --chown=node:node package.json yarn.lock ./

RUN yarn install

COPY --chown=node:node . .

USER node

FROM node:16.15.1-alpine3.16

RUN mkdir /app && chown node:node /app

WORKDIR /app

COPY --chown=node:node package.json yarn.lock ./

RUN yarn install

COPY --chown=node:node . .

EXPOSE 3000

USER node

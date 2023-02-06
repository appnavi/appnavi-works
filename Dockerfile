FROM node:18.14.0-alpine3.17

RUN mkdir /app && chown node:node /app

WORKDIR /app

COPY --chown=node:node package.json yarn.lock ./

RUN yarn install

COPY --chown=node:node . .

EXPOSE 3000

USER node

FROM node:18.14.0-alpine3.17

RUN mkdir -p /app/server && chown node:node /app/server

WORKDIR /app/server

COPY --chown=node:node server/package.json server/yarn.lock ./

RUN yarn install

COPY --chown=node:node server/ .

EXPOSE 3000

USER node

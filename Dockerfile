FROM node:18.14.0-alpine3.17

RUN mkdir /app && chown node:node /app


COPY --chown=node:node package.json yarn.lock /app/
COPY --chown=node:node client/package.json /app/client/
COPY --chown=node:node server/package.json /app/server/

WORKDIR /app

RUN yarn install

COPY --chown=node:node server /app/server
COPY --chown=node:node client /app/client

EXPOSE 3000

USER node

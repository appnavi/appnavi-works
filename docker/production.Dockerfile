FROM node:18.14.0-alpine3.17 as builder

COPY package.json yarn.lock /app/
COPY client/package.json /app/client/
COPY server/package.json /app/server/

WORKDIR /app
RUN yarn install

COPY server/ /app/server/
COPY client/ /app/client/

RUN yarn run build

FROM node:18.14.0-alpine3.17 as deps

COPY package.json yarn.lock /app/
COPY client/package.json /app/client/
COPY server/package.json /app/server/

WORKDIR /app
RUN yarn install --production

FROM node:18.14.0-alpine3.17 as runner

RUN mkdir /app && chown node:node /app

COPY --from=builder --chown=node:node /app/package.json /app/yarn.lock /app/
COPY --from=builder --chown=node:node /app/client/package.json /app/client/
COPY --from=builder --chown=node:node /app/server/package.json /app/server/

COPY --from=deps --chown=node:node /app/node_modules/ /app/node_modules/
COPY --from=deps --chown=node:node /app/server/node_modules/ /app/server/node_modules/

COPY --from=builder --chown=node:node /app/server/dist/ /app/server/dist/
COPY --from=builder --chown=node:node /app/server/dist_client/ /app/server/dist_client/
COPY --from=builder --chown=node:node /app/server/public/stylesheets/*.css /app/server/public/stylesheets/
COPY --from=builder --chown=node:node /app/server/views/ /app/server/views/

WORKDIR /app/server

USER node
EXPOSE 3000

CMD [ "node", "dist/index.js" ]
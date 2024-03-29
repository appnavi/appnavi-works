FROM node:hydrogen-alpine3.17 as builder

COPY package.json yarn.lock /app/
COPY client/package.json /app/client/
COPY server/package.json /app/server/

WORKDIR /app
RUN yarn install

COPY server/ /app/server/
COPY client/ /app/client/

RUN yarn run build

FROM node:hydrogen-alpine3.17 as runner

RUN mkdir /app && chown node:node /app

COPY --from=builder --chown=node:node /app/package.json /app/yarn.lock /app/
COPY --from=builder --chown=node:node /app/client/package.json /app/client/
COPY --from=builder --chown=node:node /app/server/package.json /app/server/
WORKDIR /app
RUN yarn install --production

COPY --from=builder --chown=node:node /app/server/dist/ /app/server/dist/
COPY --from=builder --chown=node:node /app/server/dist_client/ /app/server/dist_client/

WORKDIR /app/server

USER node
EXPOSE 3000

CMD [ "node", "dist/index.js" ]
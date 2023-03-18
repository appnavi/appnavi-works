#!/bin/sh

if [ ! -d "./secrets/staging/" ]; then
  echo -e "\e[31mstaging用のsecretsが見つかりません。\e[m"
  exit 1
fi

docker compose -f docker-compose.staging.yml -p appnavi-works-staging $@

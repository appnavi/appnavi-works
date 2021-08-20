#!/bin/sh

if [ ! -d "./secrets/development/" ]; then
  echo -e "\e[31mdevelopment用のsecretsが見つかりません。\e[m"
  exit 1
fi

docker-compose -f docker-compose.yml -f docker-compose.dev.yml -p appnavi-works-dev $@

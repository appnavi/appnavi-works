#!/bin/sh

if [ ! -d "./secrets/production/" ]; then
  echo -e "\e[31mproduction用のsecretsが見つかりません。\e[m"
  exit 1
fi

docker-compose -f docker-compose.yml -f docker-compose.production.yml -p appnavi-works $@

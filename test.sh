#!/bin/sh

if [ ! -d "./secrets/test/" ]; then
  echo -e "\e[31mtest用のsecretsが見つかりません。\e[m"
  exit 1
fi

docker-compose -f docker-compose.yml -f docker-compose.test.yml -p appnavi-works-test $@

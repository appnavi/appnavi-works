#!/bin/sh

if [ ! -d "./secrets/production/" ]; then
  echo -e "\e[31mproduction用のsecretsが見つかりません。\e[m"
  exit 1
fi

echo "OK"


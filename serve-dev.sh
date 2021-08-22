#!/bin/sh

if [ -z `docker ps --format "{{.Names}}" | grep appnavi-works-dev_appnavi-works_1` ]; then
  echo -e "\e[31m\`bash dev.sh up\`を実行した後にこのコマンドを実行してください。\e[m"
  exit 1
fi

docker exec -it -u node appnavi-works-dev_appnavi-works_1 yarn run dev

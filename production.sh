#!/bin/sh

docker-compose -f docker-compose.yml -f docker-compose.production.yml -p appnavi-works up -d $@

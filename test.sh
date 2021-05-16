#!/bin/sh

docker-compose -f docker-compose.yml -f docker-compose.test.yml -p game-upload up -d $@

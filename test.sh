#!/bin/sh

COMPOSE_FILE=docker-compose.yml:docker-compose.test.yml
docker-compose -p game-upload up -d $@

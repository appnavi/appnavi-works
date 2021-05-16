#!/bin/sh

COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml
docker-compose -p game-upload up -d $@

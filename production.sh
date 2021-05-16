#!/bin/sh

COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml docker-compose -p game-upload up -d $@

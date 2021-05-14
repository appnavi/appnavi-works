#!/bin/sh

docker-compose -p game-upload -f docker-compose.yml -f docker-compose.yml up -d $@

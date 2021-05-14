#!/bin/sh

docker-compose -p game-upload-dev -f docker-compose.yml -f docker-compose.dev.yml up -d $@

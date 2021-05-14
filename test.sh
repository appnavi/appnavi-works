#!/bin/sh

docker-compose -p game-upload-test -f docker-compose.yml -f docker-compose.test.yml up -d $@

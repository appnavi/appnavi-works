#!/bin/sh

docker-compose -f docker-compose.yml -f docker-compose.test.yml -p appnavi-works-test $@

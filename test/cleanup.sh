#!/bin/bash
docker stop mongodb
docker rm mongodb
docker rmi -f mongo
#!bin/bash

docker run -e ARANGO_NO_AUTH=1 -p 8529:8529 -d --name test-arangodb arangodb
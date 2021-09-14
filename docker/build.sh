#!/bin/sh

vScriptDir=`dirname $0`
cd ${vScriptDir}/..
docker build --platform linux/amd64 -f ${vScriptDir}/Dockerfile -t thebetabase-container .

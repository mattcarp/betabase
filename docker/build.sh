#!/bin/sh

vScriptDir=`dirname $0`
cd ${vScriptDir}/..
docker build -f ${vScriptDir}/Dockerfile -t thebetabase-container .

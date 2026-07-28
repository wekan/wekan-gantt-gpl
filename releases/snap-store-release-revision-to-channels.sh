#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan revision number:"
    echo "./releases/snap-store-release-revision-to-channels.sh 9.10"
    exit 1
fi

snapcraft release wekan $1 edge,beta,candidate

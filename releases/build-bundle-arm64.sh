#!/bin/bash

# This script is only for Wekan maintainer to
# convert x64 bundle to arm64 bundle.

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-a.sh 5.10"
    exit 1
fi

sudo apt -y install g++ build-essential p7zip-full
sudo npm -g uninstall node-pre-gyp
sudo npm -g install @mapbox/node-pre-gyp
rm -rf bundle
rm wekan-$1-arm64.zip
#rm wekan-$1.zip
#wget https://releases.wekan.team/wekan-$1.zip
7z x wekan-$1-amd64.zip

(cd bundle/programs/server && chmod u+w *.json && cd node_modules/fibers && node build.js)
#cd ../../../..
#(cd bundle/programs/server/npm/node_modules/meteor/accounts-password && npm remove bcrypt && npm install bcrypt)

# Requires building from source https://github.com/meteor/meteor/issues/11682
(cd bundle/programs/server/npm/node_modules/meteor/accounts-password && npm rebuild --build-from-source)

cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..

7z a wekan-$1-arm64.zip bundle

sudo snap start juju-db

./start-wekan.sh

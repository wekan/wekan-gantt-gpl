@ECHO OFF

REM TODO: Test how to fix this
REM Installing NPM on Windows: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
REM Install meteor with: npm -g install meteor
REM Old info: https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows
REM Please add fix PRs, like config of MongoDB etc.


md C:\repos
cd C:\repos

REM Install chocolatey
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

choco install -y git curl python2 dotnet4.5.2 nano mongodb-4 mongoclient

curl -O https://nodejs.org/dist/v14.21.3/node-v14.21.3-x64.msi
call node-v14.21.3-x64.msi

call npm config -g set msvs_version 2015
call meteor npm config -g set msvs_version 2015

call npm -g install npm
call npm -g install meteor
call npm -g install node-gyp
call npm -g install fibers
cd C:\repos
git clone https://github.com/wekan/wekan.git
cd wekan
echo "Building Wekan."
REM del /S /F /Q packages
REM ## REPOS BELOW ARE INCLUDED TO WEKAN
REM md packages
REM cd packages
REM git clone --depth 1 -b master https://github.com/wekan/flow-router.git kadira-flow-router
REM git clone --depth 1 -b master https://github.com/meteor-useraccounts/core.git meteor-useraccounts-core
REM git clone --depth 1 -b master https://github.com/wekan/meteor-accounts-cas.git
REM git clone --depth 1 -b master https://github.com/wekan/wekan-ldap.git
REM git clone --depth 1 -b master https://github.com/wekan/wekan-scrollbar.git
REM git clone --depth 1 -b master https://github.com/wekan/meteor-accounts-oidc.git
REM git clone --depth 1 -b master --recurse-submodules https://github.com/wekan/markdown.git
REM move meteor-accounts-oidc/packages/switch_accounts-oidc wekan_accounts-oidc
REM move meteor-accounts-oidc/packages/switch_oidc wekan_oidc
REM del /S /F /Q meteor-accounts-oidc
REM sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
cd ..
REM del /S /F /Q node_modules
call meteor npm install
REM del /S /F /Q .build
call meteor build .build --directory
REM ## Remove legacy webbroser bundle, so that Wekan works also at Android Firefox, iOS Safari, etc.
del /S /F /Q rm .build/bundle/programs/web.browser.legacy
REM ## Install some NPM packages
cd .build\bundle\programs\server
call meteor npm install
REM cd C:\repos\wekan\.meteor\local\build\programs\server
REM del node_modules
cd C:\repos\wekan
call start-wekan.bat

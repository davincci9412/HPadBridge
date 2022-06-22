DEPLOY CONTRACTS:
1- Deploy HPadBrdige.sol on BSC and Harmony
2- Set token address to HPAD token address using setTokenAddress
3- deposit some tokens into both contracts

CONFIGURE WEBBSITE:
1- edit app.js and update the contract addresses
2- build bundle.js using browserify
browserify app.js -o bundle.js

RUN SCRIPTS:
1- Install mongodb and make sure that it is accessible from localhost
2- configure .env
3- run monitor.js on bsc and harmony folders using pm2
cd bsc
pm2 start monitor.js
cd ../harmony
pm2 start monitor.js

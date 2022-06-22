const Web3 = require('web3');
const playAbi = require('./hpad_abi')
require('dotenv').config({path: '../.env'});
const bridgeAbi = require('./bridge_abi');
let web3 = new Web3(process.env.RPC_URL);

const contract = new web3.eth.Contract(bridgeAbi, process.env.HPAD_BRIDGE_BSC);
let owner = web3.eth.accounts.privateKeyToAccount(process.env.HPAD_PK);

web3.eth.accounts.wallet.add(owner);
web3.eth.defaultAccount = owner.address;


const mintToken = async (toWallet, amount, txId) => {
  amount = String(amount)
  try {
    const gas = await contract.methods.claim(toWallet, amount, txId).estimateGas({
      from: web3.eth.defaultAccount
    })
    const gasPrice = await web3.eth.getGasPrice();
    const mintRes = await contract.methods.claim(toWallet, amount, txId).send({
      from: web3.eth.defaultAccount,
      gasPrice: gasPrice,
      gas: gas,
    })
    .on('transactionHash', function(hash){
      console.log('transactionHash', hash)
    })
    .on('receipt', function(receipt){
      return receipt;
    })
    .on('error', function(error, receipt) {
      return error
    });
    return mintRes;
  } catch (error) {
    throw new Error(error)
  }
};

module.exports = mintToken;
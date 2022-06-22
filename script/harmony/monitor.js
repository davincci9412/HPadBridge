require('dotenv').config({path: '../.env'});
const Web3 = require('web3');
const bridgeAbi = require('./bridge_abi');
const connectDB = require('./db');
const mintToken = require('./mint_token');

const web3 = new Web3(process.env.HARMONY_RPC_URL);
const contract = new web3.eth.Contract(bridgeAbi, process.env.HPAD_BRIDGE_HARMONY);
let db = null;


const updateDb = async (id) => {
  try {
    console.log(`waiting for id: ${id}`)
    const res = await contract.methods.txs(id).call();
      if (res.wallet == '0x0000000000000000000000000000000000000000') {
        setTimeout(() => {
          updateDb(id)
        }, 5000)
      } else {
        const mintRes = await mintToken(res.toWallet, res.amount, id);
        const obj = [{
          txId: res.txId,
          wallet: res.wallet,
          amount: res.amount,
          toWallet: res.toWallet,
          isPaid: true,
          playTxInfo: mintRes
        }]
        const tx = await db.collection('harmonyTxs').insertMany(obj);
        console.log(tx)
        console.log(`tx with id ${id} is paid successfully.`)
        console.log('===================================')
        id++;
        updateDb(id);
      }
  } catch (error) {
    setTimeout(() => {
      updateDb(id)
    }, 15000)
    console.log('Waiting for 15 sec')
    throw new Error(error)
  }
};

const getLastTxID = async () => {
  const tx = await db.collection('harmonyTxs').findOne({}, {sort:{$natural:-1}});
  if (tx) {
    return Number(tx.txId);
  } else {
    return 0
  }
};

connectDB()
.then(_db => {
  db = _db;
  return db
})
.then(async () => {
  let id = await getLastTxID();
  id++;
  await updateDb(id);
})
.catch(error => {
  console.error(error);
});

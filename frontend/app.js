var { convertBech32ToHex, validateAddress } = require("@okexchain/javascript-sdk/lib/crypto");
var { HarmonyAddress } = require('@harmony-js/crypto');
var displayBridge = false;
var currentAccount = null;
var tokenContract = null;
var cmcBridgeContract = null;
var tokenAddress = "0x4Ef4E0b448AC75b7285c334e215d384E7227A2E6";
var selectedChain = $('#chain-selection').val();
var chainObj = {
  bsc: {
    bridgeAddress: "0x4A580732828edC6E90d0C9DF18825F19D6a7186E",
    abi: harmonyBridgeAbi
  },
  harmony: {
    bridgeAddress: "0x4A580732828edC6E90d0C9DF18825F19D6a7186E",
    abi: harmonyBridgeAbi
  }
}

const connect = () => {
  if (typeof window.ethereum !== 'undefined') {
    ethereum.request({ method: 'eth_requestAccounts' })
    .then(accounts => {
      currentAccount = accounts[0];
      fetchAllowance();
      getCurrentAccountBalance();
    })
    .catch(error => {
      console.log('error', error)
    });
  } else {
    return toastr.error('Please install metamask')
  }
}

const onChangeAccount = () => {
  ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // window.location = window.location.origin;
    } else {
      currentAccount = accounts[0];
      fetchAllowance();
      getCurrentAccountBalance();
    }
  });
};

const getCurrentAccountBalance = () => {
  tokenContract.methods.balanceOf(currentAccount).call().then(res => {
    balance = Number(web3.utils.fromWei(res));
    $('#balance').text(balance);
  })
};

const bridge = () => {
  try {
    let amount = $('#cmcAmount').val();
    let address = $('#solanaWallet').val().trim();

    if (!amount) {
      return toastr.error('Invalid Amount');
    }
    if (!selectedChain) return toastr.error('Select A Chain');
    if (!address) return toastr.error('Invalid Address');
    if ((selectedChain === 'solana' && address.length !== 44) ||
        (selectedChain === 'avalanche' && !web3.utils.isAddress(address))
    ) return toastr.error('Invalid Address');
    if (selectedChain === 'harmony') {
      if (HarmonyAddress.isValidBech32(address)) {
        let ins = new HarmonyAddress(address)
        address = ins.checksum
      } else if (!web3.utils.isAddress(address)) return toastr.error('Invalid Address');
    }
    if (selectedChain === 'okex') {
      if (validateAddress(address)) {
        address = convertBech32ToHex(address)[0];
      } else if (!web3.utils.isAddress(address)) return toastr.error('Invalid Address');
    }

    if (Number(amount) > Number(balance)) {
      return toastr.error('Insufficient Balance')
    }
    cmcBridgeContract.methods.deposit(web3.utils.toWei(amount), address).send({
      from: currentAccount
    })
    .on('transactionHash', function(hash){
      console.log(hash)
    })
    .on('receipt', function(receipt){
      console.log(receipt)
      getCurrentAccountBalance();
      toastr.success('Your transaction to bridge is approved.');
    })
    .on('error', function(error, receipt) {
      console.log(error)
      toastr.error(error.message || 'Some thing wrong with this transaction!')
    });
  } catch (error) {
    toastr.error(error)
  }
};

const approve = () => {

  if (!selectedChain) return toastr.error('Select A Chain');
  tokenContract.methods.approve(chainObj[selectedChain].bridgeAddress, web3.utils.toWei('1000000000000')).send({
    from: currentAccount
  })
  .on('transactionHash', function(hash){
    console.log(hash)
  })
  .on('receipt', function(receipt){
    console.log(receipt)
    toastr.success('Your transaction to get permission is approved.');
    fetchAllowance();
  })
  .on('error', function(error, receipt) {
    console.log(error)
    toastr.error(error.message || 'Some thing wrong with this transaction!')
  });
};


const fetchAllowance = () => {
  if (!selectedChain) return toastr.error('Select A Chain');
  tokenContract.methods.allowance(currentAccount, chainObj[selectedChain].bridgeAddress).call()
  .then(res => {
    console.log(res)
    if (Number(res) > 0) {
      displayBridge = true;
    } else {
      displayBridge = false;
    }
    setBridgeState();
  })
};

const setBridgeState = () => {
  if (currentAccount) {
    $('#connect').removeClass('d-block').addClass('d-none');
  } else {
    $('#connect').removeClass('d-none').addClass('d-block');
    return;
  }
  if (displayBridge) {
    $('#connect').removeClass('d-block').addClass('d-none');
    $('#approve').removeClass('d-block').addClass('d-none');
    $('#deposit').removeClass('d-none').addClass('d-block');
  } else {
    $('#connect').removeClass('d-block').addClass('d-none');
    $('#approve').removeClass('d-none').addClass('d-block');
    $('#deposit').removeClass('d-block').addClass('d-none');

  }
};

const fromWei = (num) => {
  return Number(web3.utils.fromWei(num)).toFixed(4);
}


const truncateAddress = function (address) {
  return address.slice(1, 7) + '...' + address.slice(address.length - 6);
};

$(document).ready(x => {
  alert(selectedChain);
  tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);
  cmcBridgeContract = new web3.eth.Contract(chainObj[selectedChain].abi, chainObj[selectedChain].bridgeAddress);
  $('#chain-selection').on('change', function() {
    selectedChain = this.value;
    cmcBridgeContract = new web3.eth.Contract(chainObj[selectedChain].abi, chainObj[selectedChain].bridgeAddress);
    fetchAllowance();
    getCurrentAccountBalance();
  });
  onChangeAccount();
  $("#connect").on('click', () => {
    connect();
  })
  $('#deposit').on('click', function() {
    bridge();
  });
  $('#approve').on('click', function() {
    approve();
  });
});
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HPadBridge is Ownable{
    // we assign a unique ID to each transaction(txId)
    event Bridge(
        uint256 txId,
        address wallet,
        uint256 amount,
        address toWallet
    );

    struct TX{
        uint256 txId;
       	address wallet;
        uint256 amount;
        address toWallet;
    }
    uint256 public lastTxId = 0;

    address public tokenAddress = 0x4Ef4E0b448AC75b7285c334e215d384E7227A2E6;

    mapping(uint256 => TX) public txs;

    mapping(uint256 => uint256) public claimed;    

    constructor(){

    }

    function deposit(uint256 amount, address toWallet) public returns (uint256){
    	require(amount > 0, "0");
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(address(msg.sender), address(this), amount);

        uint256 txId = ++lastTxId;
        txs[txId] = TX({
            txId: txId,
            wallet: msg.sender,
            amount: amount,
            toWallet: toWallet
        });
        emit Bridge(txId, msg.sender, amount, toWallet);
        return txId;
    }

    function claim(address toWallet, uint256 amount, uint256 txId) public onlyOwner{
        require(claimed[txId] <= 0, "already claimed");
        IERC20 token = IERC20(tokenAddress);
        token.transfer(toWallet, amount);
        claimed[txId] = amount;
    }

    // allows the owner to withdraw BNB and other tokens
    function ownerWithdraw(uint256 amount, address _to, address _tokenAddr) public onlyOwner{
        require(_to != address(0));
        if(_tokenAddr == address(0)){
        	payable(_to).transfer(amount);
        }else{
        	IERC20(_tokenAddr).transfer(_to, amount);	
        }
    }

    function setTokenAddress(address newToken) public onlyOwner {
        tokenAddress = newToken;
    }
}

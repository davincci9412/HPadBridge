// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

abstract contract BPContract{
    function protect(
        address sender, 
        address receiver, 
        uint256 amount
    ) external virtual;
}

contract HarmonyPad is ERC20, ERC20Burnable, Ownable {
    address public lpRewardsAddress;

    mapping(address => bool) public excludeFees;
    mapping(address => bool) public blocked;

    bool public initialized = false;

    uint256 public lpFeePercent;
    uint256 public burnFeePercent;

    uint256 public maxTxAmount;
    uint256 public coolDownTime;

    BPContract public BP;
    bool public bpEnabled;

    //sender => receipant => amount
    mapping(address => mapping(address => uint256)) public lastTxTime;

    constructor() ERC20("HarmonyPad", "HPAD") {
        excludeFees[msg.sender] = true;
        excludeFees[address(0)] = true;

        lpRewardsAddress = msg.sender; // by default
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _internalTransfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _internalTransfer(sender, recipient, amount);
        uint256 currentAllowance = allowance(sender, msg.sender);
        require(currentAllowance >= amount, "501");
        _approve(sender, msg.sender, currentAllowance - amount);

        return true;
    }

    function _internalTransfer(address sender, address recipient, 
        uint256 amount) private returns(bool){

        require(!blocked[sender], "blocked");

        require(
            maxTxAmount == 0 ||
            amount <= maxTxAmount, "maxTx err"
        );

        require(coolDownTime == 0 ||
            block.timestamp - lastTxTime[sender][recipient] > coolDownTime ||
            excludeFees[recipient],
            "cooldown err"
        );

        if (bpEnabled) {
            BP.protect(sender, recipient, amount);
        }
        
        lastTxTime[sender][recipient] = block.timestamp;

        if(excludeFees[recipient] ||  (burnFeePercent == 0 && lpFeePercent == 0 ) ){
            _transfer(sender, recipient, amount);
            return true;
        }
        uint256 burnFee = amount * burnFeePercent / 1000;
        uint256 lpFee = amount * lpFeePercent / 1000;

        _transfer(sender, recipient, amount - burnFee - lpFee);

        if(burnFee > 0){
            _burn(sender, burnFee);
        }
        if(lpFee > 0){
            _transfer(sender, lpRewardsAddress, lpFee);
        }
        return true;
    }

    function setBPAddrss(address _bp) external onlyOwner {
        BP = BPContract(_bp);
    }

    function setBpEnabled(bool _enabled) external onlyOwner {
        bpEnabled = _enabled;
    }

    function setLpRewardsAddress(address newAddress) public onlyOwner {
        lpRewardsAddress = newAddress;
    }

    function init(uint256 _supply, uint256 _lpFeePercent,
        uint256 _burnFeePercent,
        uint256 _maxTxAmount,
        uint256 _coolDownTime
    ) public onlyOwner{
        require(!initialized, "Already initialized");
        initialized = true;
        _mint(msg.sender, _supply);

        lpFeePercent = _lpFeePercent;
        burnFeePercent = _burnFeePercent;
        maxTxAmount = _maxTxAmount;
        coolDownTime = _coolDownTime;
    }

    function update(uint256 _lpFeePercent,
        uint256 _burnFeePercent,
        uint256 _maxTxAmount,
        uint256 _coolDownTime
    ) public onlyOwner{
        lpFeePercent = _lpFeePercent;
        burnFeePercent = _burnFeePercent;
        maxTxAmount = _maxTxAmount;
        coolDownTime = _coolDownTime;
    }

    function blockAddress(
        address addr
    ) public onlyOwner{
        blocked[addr] = true;
    }

    function unBlockAddress(
        address addr
    ) public onlyOwner{
        blocked[addr] = false;
    }
}
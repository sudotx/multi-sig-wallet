// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

contract Wallet {
  address[] public approvers; //this keeps an array of addresses of approvers
  uint256 public quorum; //this is the maximum number of approvers needed to make a transaction

  struct Transfer {
    //this is a single transfer object, it details;
    uint256 id; //an individual transfer identifier, the current transfers array length
    uint256 amount; //amount associated with the transfer
    address payable to; //address being sent value
    uint256 approvals;
    bool sent;
  }

  Transfer[] public transfers;

  mapping(address => mapping(uint256 => bool)) public approvals; //maps an account to current transfer tells if it has been approved by a current address, it maps an address to an id of transaction, and is either been approved by the address or not

  constructor(address[] memory _approvers, uint256 _quorum) {
    //initiated once contract is deployed.
    approvers = _approvers; //list of account that are allowed to approve a transaction
    quorum = _quorum; //minimum number of approvals needed to send a single transfer
  }

  modifier onlyApprover() {
    bool allowed = false;
    for (uint256 i = 0; i < approvers.length; i++) {
      if (approvers[i] == msg.sender) {
        allowed = true;
      }
    }
    require(allowed == true, "only approver allowed");
    _;
  }

  function getTransfers() external view returns (Transfer[] memory) {
    //in order to return an array from a struct , i added an extra pragma compiler to enable features of the compiler that isnt available by default
    return transfers; //returns addresses that have approved the transfer
  }

  function getApprovers() external view returns (address[] memory) {
    return approvers; //returns addresses that have approved the transfer
  }

  function approveTransfer(uint256 id) external onlyApprover {
    //this is to approve transfer objects that have been created already
    require(transfers[id].sent == false, "transfer has already been sent");
    require(
      approvals[msg.sender][id] == false,
      "cannot approve transfer twice"
    );

    approvals[msg.sender][id] = true; //sets approve on current transfer to true,if false
    transfers[id].approvals++; //adds to the number of approvals on a single transfer

    if (transfers[id].approvals >= quorum) {
      transfers[id].sent = true;
      address payable to = transfers[id].to;
      uint256 amount = transfers[id].amount;
      to.transfer(amount);
    }
  }

  function createTransfer(uint256 amount, address payable to)
    external
    onlyApprover
  {
    transfers.push(
      Transfer( //creates transfer struct
        transfers.length, //declares the current length of array to id of individual item
        amount,
        to,
        0, //initial number of approvals on transfer
        false
      ) //adds new transfer to the array list of transfers
    );
  }

  receive() external payable {}
}

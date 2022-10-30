const { expectRevert } = require("@openzeppelin/test-helpers");
const Wallet = artifacts.require("Wallet");

contract("Wallet", (accounts) => {
  let wallet; //creates an instance of the wallet contract, available in js
  beforeEach(async () => {
    wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2); //puts this into the argument of the constructor
    await web3.eth.sendTransaction({
      //bundles the transaction with the following arguments
      from: accounts[0],
      to: wallet.address,
      value: 1000,
    });
  });

  it("should have correct approvers and quorum", async () => {
    const approvers = await wallet.getApprovers(); //refers to the function in the wallet
    const quorum = await wallet.quorum();
    assert(approvers.length === 3); //tests fails if any of the assertions are not met
    assert(approvers[0] === accounts[0]);
    assert(approvers[1] === accounts[1]);
    assert(approvers[2] === accounts[2]);
    assert(quorum.toNumber() === 2); //use BN.js to handle huge number in js
  });

  it("should create transfers", async () => {
    await wallet.createTransfer(100, accounts[5], { from: accounts[0] }); //creates an transaction of 100wei from an approved account
    const transfers = await wallet.getTransfers(); //refers to the get transfers function, which returns the transfer array of all Transfers

    assert(transfers.length === 1);
    assert(transfers[0].id === "0"); //number in field in struct are stored as strings, they are not wrapped by BN.js
    assert(transfers[0].amount === "100");
    assert(transfers[0].to === accounts[5]);
    assert(transfers[0].approvals === "0");
    assert(transfers[0].sent === false);
  });

  it("should NOT create transfers if sender is not approved", async () => {
    await expectRevert(
      //this tries to send a transaction from an unapproved account, it passes if it reverts when it tries this
      wallet.createTransfer(100, accounts[5], { from: accounts[4] }),
      "only approver allowed"
    );
  });

  it("should increment approvals", async () => {
    await wallet.createTransfer(100, accounts[5], { from: accounts[0] }); //builds a transaction
    await wallet.approveTransfer(0, { from: accounts[0] }); //approve transfer from one account
    const transfers = await wallet.getTransfers();
    const balance = await web3.eth.getBalance(wallet.address); //get balance of of the entire contract

    assert(transfers[0].approvals === "1"); //approvals on the first transfer should be one
    assert(transfers[0].sent === false); //transfer should not have sent yet
    assert(balance === "1000"); //total contract balance should be unchanged
  });

  it("should send transfer if quorum reached", async () => {
    const balanceBefore = web3.utils.toBN(
      await web3.eth.getBalance(accounts[6])
    ); //balance of account before transaction, it converts the balance to BN.
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] }); //build a transfer
    await wallet.approveTransfer(0, { from: accounts[0] }); //approve transaction from one approved account
    await wallet.approveTransfer(0, { from: accounts[1] }); //approve transaction from another approved account, to complete the minimum quorum
    const balanceAfter = web3.utils.toBN(
      await web3.eth.getBalance(accounts[6])
    ); //balance of account after the transfer
    assert(balanceAfter.sub(balanceBefore).toNumber() === 100); //assert the difference of thw two balances, it has to be zero
  });

  it("should NOT approve transfer if sender is not allowed", async () => {
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] }); //creates a transfer

    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[3] }),
      "only approver allowed"
    ); //should revert since approval is coming from an account thats not valid
  });

  it("should NOT approve transfer if transfer is already sent", async () => {
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] });

    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[2] }),
      "transfer has already been sent"
    );
  }); //should revert since transfer has a passed the maximum amount of approvals and has sent

  it("should NOT approve transfer twice", async () => {
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[0] }),
      "cannot approve transfer twice"
    );
  }); //reverts if an account attempts to approve a transaction twice
});

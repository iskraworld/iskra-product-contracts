const { ethers } = require("hardhat");
const { expect } = require("chai");

function shouldBehaveLikeERC1363TransferAndCall(
  deployer,
  anotherAccount,
  recipient
) {
  let ERC1363Receiver,
    ERC1363ReceiverInvalidReturn,
    ERC1363ReceiverMissingParam;

  before(async function () {
    ERC1363Receiver = await ethers.getContractFactory("ERC1363Receiver");
    ERC1363ReceiverInvalidReturn = await ethers.getContractFactory(
      "ERC1363ReceiverInvalidReturn"
    );
    ERC1363ReceiverMissingParam = await ethers.getContractFactory(
      "ERC1363ReceiverMissingParam"
    );
  });

  describe("ERC1363", function () {
    describe("transferAndCall", function () {
      const amount = 1;

      it("should work with `ERC1363Receiver` implemented contracts", async function () {
        const receiver = await ERC1363Receiver.deploy();

        expect(
          await this.token["transferAndCall(address,uint256)"](
            receiver.address,
            amount
          )
        )
          .to.emit(this.token, "Transfer")
          .withArgs(deployer.address, receiver.address, amount)
          .to.emit(receiver, "OnReceived")
          .withArgs(
            this.token.address,
            deployer.address,
            deployer.address,
            amount,
            "0x"
          );
      });

      it("should work with `ERC1363Receiver` implemented contracts and pass data properly", async function () {
        const receiver = await ERC1363Receiver.deploy();
        const data = "0x1234";

        expect(
          await this.token["transferAndCall(address,uint256,bytes)"](
            receiver.address,
            amount,
            data
          )
        )
          .to.emit(this.token, "Transfer")
          .withArgs(deployer.address, receiver.address, amount)
          .to.emit(receiver, "OnReceived")
          .withArgs(
            this.token.address,
            deployer.address,
            deployer.address,
            amount,
            data
          );
      });

      it("will fail for EOA recipient", async function () {
        await expect(
          this.token["transferAndCall(address,uint256)"](
            recipient.address,
            amount
          )
        ).to.be.revertedWith("ERC1363: _checkAndCallTransfer reverts");
      });

      it("will fail when receivers do not return proper sig", async function () {
        const receiver = await ERC1363ReceiverInvalidReturn.deploy();

        await expect(
          this.token["transferAndCall(address,uint256)"](
            receiver.address,
            amount
          )
        ).to.be.revertedWith("ERC1363: _checkAndCallTransfer reverts");
      });

      it("will fail when receivers do not implement `ERC1363Receiver` properly", async function () {
        const receiver = await ERC1363ReceiverMissingParam.deploy();

        await expect(
          this.token["transferAndCall(address,uint256)"](
            receiver.address,
            amount
          )
        ).to.be.reverted;
      });
    });

    describe("transferFromAndCall", function () {
      const amount = 1;
      let tokenOwner, spender, tokenOwnerAddr, spenderAddr, recipientAddr;

      beforeEach(async function () {
        tokenOwner = deployer;
        spender = anotherAccount;
        tokenOwnerAddr = tokenOwner.address;
        spenderAddr = spender.address;
        recipientAddr = recipient.address;
        await this.token
          .connect(tokenOwner.signer)
          .approve(spenderAddr, amount);
      });

      it("should work with `ERC1363Receiver` implemented contracts", async function () {
        const receiver = await ERC1363Receiver.deploy();

        const tx = await this.token
          .connect(spender.signer)
          ["transferFromAndCall(address,address,uint256)"](
            tokenOwnerAddr,
            receiver.address,
            amount
          );
        expect(tx)
          .to.emit(this.token, "Transfer")
          .withArgs(tokenOwnerAddr, receiver.address, amount)
          .to.emit(receiver, "OnReceived")
          .withArgs(
            this.token.address,
            spenderAddr,
            tokenOwnerAddr,
            amount,
            "0x"
          );
      });

      it("should work with `ERC1363Receiver` implemented contracts and pass data properly", async function () {
        const receiver = await ERC1363Receiver.deploy();
        const data = "0x1234";

        const tx = await this.token
          .connect(spender.signer)
          ["transferFromAndCall(address,address,uint256,bytes)"](
            tokenOwnerAddr,
            receiver.address,
            amount,
            data
          );
        expect(tx)
          .to.emit(this.token, "Transfer")
          .withArgs(tokenOwnerAddr, receiver.address, amount)
          .to.emit(receiver, "OnReceived")
          .withArgs(
            this.token.address,
            spenderAddr,
            tokenOwnerAddr,
            amount,
            data
          );
      });

      it("will fail for EOA recipient", async function () {
        const tx = this.token
          .connect(spender.signer)
          ["transferFromAndCall(address,address,uint256)"](
            tokenOwnerAddr,
            recipientAddr,
            amount
          );
        await expect(tx).to.be.revertedWith(
          "ERC1363: _checkAndCallTransfer reverts"
        );
      });

      it("will fail when receivers do not return proper sig", async function () {
        const receiver = await ERC1363ReceiverInvalidReturn.deploy();

        let tx = this.token
          .connect(spender.signer)
          ["transferFromAndCall(address,address,uint256)"](
            tokenOwnerAddr,
            receiver.address,
            amount
          );
        await expect(tx).to.be.revertedWith(
          "ERC1363: _checkAndCallTransfer reverts"
        );
      });

      it("will fail when receivers do not implement `ERC1363Receiver` properly", async function () {
        const receiver = await ERC1363ReceiverMissingParam.deploy();

        let tx = this.token
          .connect(spender.signer)
          ["transferFromAndCall(address,address,uint256)"](
            tokenOwnerAddr,
            receiver.address,
            amount
          );
        await expect(tx).to.be.reverted;
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC1363TransferAndCall,
};

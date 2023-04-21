const { ethers } = require("hardhat");
const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
} = require("./ERC20/ERC20.behavior");
const {
  shouldBehaveLikeERC1363TransferAndCall,
} = require("./ERC20/ERC1363.behavior");

describe("UtilityToken contract", function () {
  const initialSupply = 100000000;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const CandyToken = await ethers.getContractFactory("UtilityToken", owner);
    this.token = await CandyToken.deploy("Candy Token", "CND", owner.address);
    await this.token.deployed();
    this.token.mint(owner.address, initialSupply);
  });

  describe("ERC20 behavior", function () {
    const initialHolder = {};
    const recipient = {};
    const anotherAccount = {};

    beforeEach(async function () {
      initialHolder.signer = owner;
      initialHolder.address = owner.address;
      recipient.signer = user1;
      recipient.address = user1.address;
      anotherAccount.signer = user2;
      anotherAccount.address = user2.address;
    });

    shouldBehaveLikeERC20(
      "ERC20",
      initialSupply,
      initialHolder,
      recipient,
      anotherAccount
    );
  });

  describe("ERC20Transfer behavior", function () {
    const initialHolder = {};
    const recipient = {};

    beforeEach(async function () {
      initialHolder.signer = owner;
      initialHolder.address = owner.address;
      recipient.signer = user1;
      recipient.address = user1.address;
    });

    shouldBehaveLikeERC20Transfer(
      "ERC20",
      initialHolder,
      recipient,
      initialSupply,
      function (from, to, value) {
        return this.token.connect(from.signer).transfer(to, value);
      }
    );
  });

  describe("ERC20Approve behavior", function () {
    const initialHolder = {};
    const recipient = {};

    beforeEach(async function () {
      initialHolder.signer = owner;
      initialHolder.address = owner.address;
      recipient.signer = user1;
      recipient.address = user1.address;
    });

    shouldBehaveLikeERC20Approve(
      "ERC20",
      initialHolder,
      recipient,
      initialSupply,
      function (owner, spender, amount) {
        return this.token.connect(owner.signer).approve(spender, amount);
      }
    );
  });

  describe("addMinter, removeMinter", function () {
    it("basic", async function () {
      await expect(
        this.token.connect(user1).mint(user1.address, 1000000)
      ).to.revertedWith("caller is not a minter");
      await this.token.addMinter(user1.address);
      await expect(this.token.connect(user1).mint(user1.address, 1000000)).not
        .to.reverted;
      await this.token.removeMinter(user1.address);
      await expect(
        this.token.connect(user1).mint(user1.address, 1000000)
      ).to.revertedWith("caller is not a minter");
    });
  });

  describe("ERC1363TransferAndCall behavior", function () {
    const initialHolder = {};
    const spender = {};
    const recipient = {};

    beforeEach(async function () {
      initialHolder.signer = owner;
      initialHolder.address = owner.address;
      spender.signer = user1;
      spender.address = user1.address;
      recipient.signer = user2;
      recipient.address = user2.address;
    });

    shouldBehaveLikeERC1363TransferAndCall(initialHolder, spender, recipient);
  });
});

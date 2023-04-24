const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const { utils } = require("ethers");
const { shouldBehaveLikeERC1155 } = require("./ERC1155/ERC1155.behavior");

describe("MultiToken", function () {
  let MultiToken;

  const PAUSER_ROLE = utils.keccak256(utils.toUtf8Bytes("PAUSER_ROLE"));
  const baseUri = "https://test-base-uri/";
  const name = "testToken";
  let burnable = false,
    pausable = false;
  let deployer, firstHolder, secondHolder, multiTokenHolder, recipient;
  let token;

  beforeEach(async function () {
    [
      deployer,
      firstHolder,
      secondHolder,
      multiTokenHolder,
      recipient,
      proxyTester,
    ] = await ethers.getSigners();

    MultiToken = await ethers.getContractFactory("MultiToken", deployer);

    this.token = this.contract = await MultiToken.deploy(
      baseUri,
      name,
      pausable,
      burnable
    );
    await this.token.deployed();
  });

  describe("ERC1155 behavior", function () {
    const cDeployer = {};
    const cFirstHolder = {};
    const cSecondHolder = {};
    const cMultiTokenHolder = {};
    const cRecipient = {};
    const cProxyTester = {};

    beforeEach(async function () {
      cDeployer.signer = deployer;
      cDeployer.address = deployer.address;
      cFirstHolder.signer = firstHolder;
      cFirstHolder.address = firstHolder.address;
      cSecondHolder.signer = secondHolder;
      cSecondHolder.address = secondHolder.address;
      cMultiTokenHolder.signer = multiTokenHolder;
      cMultiTokenHolder.address = multiTokenHolder.address;
      cRecipient.signer = recipient;
      cRecipient.address = recipient.address;
      cProxyTester.signer = proxyTester;
      cProxyTester.address = proxyTester.address;
    });

    shouldBehaveLikeERC1155([
      cDeployer,
      cFirstHolder,
      cSecondHolder,
      cMultiTokenHolder,
      cRecipient,
      cProxyTester,
    ]);
  });

  describe("optionalize pausable", function () {
    let pausableToken;

    beforeEach(async function () {
      pausableToken = await MultiToken.deploy(baseUri, name, true, false);
      await pausableToken.deployed();
    });

    it("will be paused if pausable was enabled", async function () {
      expect(pausableToken.connect(deployer).pause()).to.emit(
        MultiToken,
        "Paused"
      );
    });
  });

  describe("optionalize burnable", function () {
    const tokenId = 1,
      tokenAmount = 1;
    let burnableToken;

    beforeEach(async function () {
      burnableToken = await MultiToken.deploy(baseUri, name, false, true);
      await burnableToken.deployed();
    });

    it("burn will be failed if burnable was disabled", async function () {
      await this.token.mint(firstHolder.address, tokenId, tokenAmount, "0x");
      let tx = this.token
        .connect(firstHolder)
        .burn(firstHolder.address, tokenId, tokenAmount);
      await expect(tx).to.be.revertedWith("MultiToken: burnable is disabled");
    });

    it("burn will be failed if a token owner does not have burn permission when burnable was enabled", async function () {
      await burnableToken.mint(firstHolder.address, tokenId, tokenAmount, "0x");
      expect(
        await burnableToken.balanceOf(firstHolder.address, tokenId)
      ).to.be.equal(1);
      let tx = burnableToken
        .connect(firstHolder)
        .burn(firstHolder.address, tokenId, tokenAmount);
      await expect(tx).to.be.revertedWith(
        "MultiToken: msg.sender does not have permission to burn"
      );
    });

    it("will be burned if a token owner is owner when burnable was enabled", async function () {
      await burnableToken.mint(deployer.address, tokenId, tokenAmount, "0x");
      expect(
        await burnableToken.balanceOf(deployer.address, tokenId)
      ).to.be.equal(1);

      await burnableToken.burn(deployer.address, tokenId, tokenAmount);
      expect(
        await burnableToken.balanceOf(deployer.address, tokenId)
      ).to.be.equal(0);
    });

    it("will be burned if a token owner is approved burn permission when burnable was enabled", async function () {
      await burnableToken.mint(firstHolder.address, tokenId, tokenAmount, "0x");
      expect(
        await burnableToken.balanceOf(firstHolder.address, tokenId)
      ).to.be.equal(1);

      await expect(
        burnableToken.setApprovalBurnPermission(firstHolder.address, true)
      )
        .to.emit(burnableToken, "ApprovalBurnPermission")
        .withArgs(firstHolder.address, true);

      await burnableToken
        .connect(firstHolder)
        .burn(firstHolder.address, tokenId, tokenAmount);
      expect(
        await burnableToken.balanceOf(firstHolder.address, tokenId)
      ).to.be.equal(0);
    });

    it("burn will be failed cannot burn other account's tokens even if have burn permissions", async function () {
      await burnableToken.mint(firstHolder.address, tokenId, tokenAmount, "0x");
      expect(
        await burnableToken.balanceOf(firstHolder.address, tokenId)
      ).to.be.equal(1);
      let tx = burnableToken.burn(firstHolder.address, tokenId, tokenAmount);
      await expect(tx).to.be.revertedWith(
        "ERC1155: caller is not token owner or approved"
      );
    });
  });
});

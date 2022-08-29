const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;
const { expect } = require("chai");
const { artifacts, contract } = require("hardhat");

const { shouldBehaveLikeERC1155 } = require("./ERC1155/ERC1155.behavior");
const {
  shouldBehaveLikeAccessControl,
} = require("./../access/AccessControl.behavior");
const {
  shouldBehaveLikeERC1155Burnable,
} = require("./ERC1155/extensions/ERC1155Burnable.behavior");
const {
  shouldBehaveLikeERC1155Pausable,
} = require("./ERC1155/extensions/ERC1155Pausable.behavior");
const {
  shouldBehaveLikeERC1155Supply,
} = require("./ERC1155/extensions/ERC1155Supply.behavior");
const {
  shouldBehaveLikeERC1155URIStorage,
} = require("./ERC1155/extensions/ERC1155URIStorage.behavior");
const MultiToken = artifacts.require("MultiTokenMock");

contract("MultiToken", function (accounts) {
  const [owner, another] = accounts;

  describe("ERC1155 behavior", function () {
    beforeEach(async function () {
      this.token = await MultiToken.new("");
    });
    shouldBehaveLikeERC1155(accounts);
  });
  describe("Access Control behavior", function () {
    beforeEach(async function () {
      this.accessControl = await MultiToken.new("");
    });
    shouldBehaveLikeAccessControl("AccessControl", ...accounts);
  });
  describe("ERC1155 Extensions", function () {
    describe("ERC1155Burnable behavior", function () {
      shouldBehaveLikeERC1155Burnable(MultiToken, ...accounts);
    });
    describe("ERC1155Pausable behavior", function () {
      shouldBehaveLikeERC1155Pausable(MultiToken, ...accounts);
    });
    describe("ERC1155Supply behavior", function () {
      shouldBehaveLikeERC1155Supply(MultiToken, owner);
    });
    describe("ERC1155URIStorage behavior", function () {
      shouldBehaveLikeERC1155URIStorage(MultiToken, owner);
    });
  });

  describe("MultiToken Extension", function () {
    beforeEach(async function () {
      this.token = await MultiToken.new("");
    });
    context("when the token is not minted yet", function () {
      describe("mint non-fungible token", function () {
        const tokenid = new BN(1).shln(255);
        it("reverts when mint a nft with token id leading 1 amount 2", async function () {
          await expectRevert(
            this.token.mint(owner, tokenid, 2, "0x"),
            "MultiToken: the amount of non-fungible token should be 1"
          );
        });
        it("mint a nft with token id leading 1 amount 1", async function () {
          const receipt = await this.token.mint(owner, tokenid, 1, "0x");
          expectEvent(receipt, "TransferSingle", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            id: tokenid,
            value: new BN(1),
          });
        });
      });
      describe("mint fungible token", function () {
        const tokenid = new BN(1);
        it("mint a ft with token id leading 1 amount 1", async function () {
          const receipt = await this.token.mint(owner, tokenid, 1, "0x");
          expectEvent(receipt, "TransferSingle", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            id: tokenid,
            value: new BN(1),
          });
        });
        it("mint a ft with token id leading 1 amount 2", async function () {
          const receipt = await this.token.mint(owner, tokenid, 2, "0x");
          expectEvent(receipt, "TransferSingle", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            id: tokenid,
            value: new BN(2),
          });
        });
      });
      describe("setURI", function () {
        it("uri(id) return nothing", async function () {
          expect(await this.token.uri(0)).to.be.equal("");
        });
        it("setURI emits URI log and update the uri for ft", async function () {
          const tokenid = new BN(0);
          const URI = "it is sample uri";
          const receipt = await this.token.setURI(tokenid, URI);
          expectEvent(receipt, "URI", {
            value: URI,
            id: tokenid,
          });
          expect(await this.token.uri(tokenid)).to.be.equal(URI);
        });
        it("reverts when another account has not the URI_SETTER_ROLE", async function () {
          const tokenid = new BN(0);
          const URI = "it is sample uri";
          await expectRevert(
            this.token.setURI(tokenid, URI, { from: another }),
            "AccessControl: account"
          );
        });
      });
      describe("mintBatch tokens", function () {
        it("mint nfts", async function () {
          const tokenid = new BN(1).shln(255);
          const receipt = await this.token.mintBatch(
            owner,
            [
              tokenid,
              tokenid.add(new BN(1)),
              tokenid.add(new BN(2)),
              tokenid.add(new BN(3)),
            ],
            [new BN(1), new BN(1), new BN(1), new BN(1)],
            "0x"
          );
          expectEvent(receipt, "TransferBatch", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            ids: [
              tokenid,
              tokenid.add(new BN(1)),
              tokenid.add(new BN(2)),
              tokenid.add(new BN(3)),
            ],
            values: [new BN(1), new BN(1), new BN(1), new BN(1)],
          });
        });
        it("mint fts", async function () {
          const tokenid = new BN(1);
          const receipt = await this.token.mintBatch(
            owner,
            [
              tokenid,
              tokenid.add(new BN(1)),
              tokenid.add(new BN(2)),
              tokenid.add(new BN(3)),
            ],
            [new BN(100), new BN(200), new BN(300), new BN(400)],
            "0x"
          );
          expectEvent(receipt, "TransferBatch", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            ids: [
              tokenid,
              tokenid.add(new BN(1)),
              tokenid.add(new BN(2)),
              tokenid.add(new BN(3)),
            ],
            values: [new BN(100), new BN(200), new BN(300), new BN(400)],
          });
        });
        it("mint fts nfts mixed", async function () {
          const fungibleTokenId = new BN(1);
          const nonfungibleTokenId = new BN(1).shln(255);
          const receipt = await this.token.mintBatch(
            owner,
            [
              fungibleTokenId,
              nonfungibleTokenId,
              fungibleTokenId.add(new BN(2)),
              nonfungibleTokenId.add(new BN(3)),
            ],
            [new BN(100), new BN(1), new BN(300), new BN(1)],
            "0x"
          );
          expectEvent(receipt, "TransferBatch", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            ids: [
              fungibleTokenId,
              nonfungibleTokenId,
              fungibleTokenId.add(new BN(2)),
              nonfungibleTokenId.add(new BN(3)),
            ],
            values: [new BN(100), new BN(1), new BN(300), new BN(1)],
          });
        });
        it("reverts when the numbers of ids and amounts are mismatched", async function () {
          const tokenid = new BN(1);
          await expectRevert(
            this.token.mintBatch(
              owner,
              [
                tokenid,
                tokenid.add(new BN(1)),
                tokenid.add(new BN(2)),
                tokenid.add(new BN(3)),
              ],
              [new BN(1), new BN(1), new BN(1)],
              "0x"
            ),
            "ERC1155: ids and amounts length mismatch"
          );
        });
        it("reverts when the token id invalid or the amount is exceed 1", async function () {
          const tokenid = new BN(1).shln(255);
          await expectRevert(
            this.token.mintBatch(
              owner,
              [
                tokenid,
                tokenid.add(new BN(1)),
                tokenid.add(new BN(2)),
                tokenid.add(new BN(3)),
              ],
              [new BN(1), new BN(2), new BN(1), new BN(1)],
              "0x"
            ),
            "MultiToken: the amount of non-fungible token should be 1"
          );
        });
      });
    });
    context("when the token is minted", function () {
      const nfttokenid = new BN(1).shln(255);
      const fttokenid = new BN(1);
      beforeEach(async function () {
        await this.token.mint(owner, nfttokenid, 1, "0x");
        await this.token.mint(owner, fttokenid, 1, "0x");
      });
      describe("setURI", function () {
        const URI = "THIS IS A SAMPLE URI";
        it("uri(id) return nothing", async function () {
          expect(await this.token.uri(nfttokenid)).to.be.equal("");
        });
        it("setURI emits URI log and update the uri for nft", async function () {
          const receipt = await this.token.setURI(nfttokenid, URI);
          expectEvent(receipt, "URI", {
            value: URI,
            id: nfttokenid,
          });
          expect(await this.token.uri(nfttokenid)).to.be.equal(URI);
        });
        it("setURI emits URI log and update the uri for ft", async function () {
          const receipt = await this.token.setURI(fttokenid, URI);
          expectEvent(receipt, "URI", {
            value: URI,
            id: fttokenid,
          });
          expect(await this.token.uri(fttokenid)).to.be.equal(URI);
        });
      });
      describe("mint nft", function () {
        it("reverts when mint a nft with token id leading 1 amount 1 again with the same token id", async function () {
          expect(await this.token.totalSupply(nfttokenid)).to.be.equal(
            new BN(1)
          );
          await expectRevert(
            this.token.mint(owner, nfttokenid, 1, "0x"),
            "MultiToken: the token already minted"
          );
          expect(await this.token.totalSupply(nfttokenid)).to.be.equal(
            new BN(1)
          );
        });
      });
      describe("mint ft", function () {
        it("mint a ft with token id leading 0 amount 1 again with the same token id", async function () {
          expect(await this.token.totalSupply(fttokenid)).to.be.equal(
            new BN(1)
          );
          const receipt = await this.token.mint(owner, fttokenid, 1, "0x");
          expectEvent(receipt, "TransferSingle", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            id: fttokenid,
            value: new BN(1),
          });
          expect(await this.token.totalSupply(fttokenid)).to.be.equal(
            new BN(2)
          );
        });
      });
      describe("mintBatch", function () {
        it("mint fts nfts mixed avoiding already minted nft", async function () {
          const fungibleTokenId = new BN(1);
          const receipt = await this.token.mintBatch(
            owner,
            [
              fungibleTokenId,
              nfttokenid.add(new BN(100)),
              fungibleTokenId.add(new BN(2)),
              nfttokenid.add(new BN(101)),
            ],
            [new BN(100), new BN(1), new BN(300), new BN(1)],
            "0x"
          );
          expectEvent(receipt, "TransferBatch", {
            operator: owner,
            from: ZERO_ADDRESS,
            to: owner,
            ids: [
              fungibleTokenId,
              nfttokenid.add(new BN(100)),
              fungibleTokenId.add(new BN(2)),
              nfttokenid.add(new BN(101)),
            ],
            values: [new BN(100), new BN(1), new BN(300), new BN(1)],
          });
        });
        it("reverts when nft already minted", async function () {
          await expectRevert(
            this.token.mintBatch(
              owner,
              [
                nfttokenid,
                nfttokenid.add(new BN(1)),
                nfttokenid.add(new BN(2)),
                nfttokenid.add(new BN(3)),
              ],
              [new BN(1), new BN(1), new BN(1), new BN(1)],
              "0x"
            ),
            "MultiToken: the token already minted"
          );
        });
      });
    });
  });
});

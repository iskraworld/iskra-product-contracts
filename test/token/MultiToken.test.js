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
});

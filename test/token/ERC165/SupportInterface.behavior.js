const { expect } = require("chai");
const { makeInterfaceId } = require("@openzeppelin/test-helpers");

const INTERFACES = {
  ERC165: ["supportsInterface(bytes4)"],
  ERC1363: [
    "transferAndCall(address,uint256)",
    "transferAndCall(address,uint256,bytes)",
    "transferFromAndCall(address,address,uint256)",
    "transferFromAndCall(address,address,uint256,bytes)",
    "approveAndCall(address,uint256)",
    "approveAndCall(address,uint256,bytes)",
  ],
  ERC20: [
    "totalSupply()",
    "balanceOf(address)",
    "transfer(address,uint256)",
    "allowance(address,address)",
    "approve(address,uint256)",
    "transferFrom(address,address,uint256)",
  ],
  ERC721: [
    "balanceOf(address)",
    "ownerOf(uint256)",
    "approve(address,uint256)",
    "getApproved(uint256)",
    "setApprovalForAll(address,bool)",
    "isApprovedForAll(address,address)",
    "transferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256,bytes)",
  ],
  ERC721Enumerable: [
    "totalSupply()",
    "tokenOfOwnerByIndex(address,uint256)",
    "tokenByIndex(uint256)",
  ],
  ERC721Metadata: ["name()", "symbol()", "tokenURI(uint256)"],
  AccessControl: [
    "getRoleAdmin(bytes32)",
    "grantRole(bytes32,address)",
    "hasRole(bytes32,address)",
    "renounceRole(bytes32,address)",
    "revokeRole(bytes32,address)",
  ],
};

const INTERFACE_IDS = {};
const FN_SIGNATURES = {};
for (const k of Object.getOwnPropertyNames(INTERFACES)) {
  INTERFACE_IDS[k] = makeInterfaceId.ERC165(INTERFACES[k]);
  for (const fnName of INTERFACES[k]) {
    // the interface id of a single function is equivalent to its function signature
    FN_SIGNATURES[fnName] = makeInterfaceId.ERC165([fnName]);
  }
}

function shouldSupportInterfaces(interfaces = []) {
  describe("Should support interfaces", function () {
    let contractUnderTest;
    beforeEach(function () {
      contractUnderTest = this.contract;
    });

    for (const k of interfaces) {
      const interfaceId = INTERFACE_IDS[k];

      it(`should be supported ${k}`, async function () {
        expect(await contractUnderTest.supportsInterface(interfaceId)).to.equal(
          true
        );
      });
    }
  });
}

function shouldNotSupportInterfaces(interfaces = []) {
  describe("Should not support interfaces", function () {
    let contractUnderTest;
    beforeEach(function () {
      contractUnderTest = this.contract;
    });

    for (const k of interfaces) {
      const interfaceId = INTERFACE_IDS[k];

      it(`should not be supported ${k}`, async function () {
        expect(await contractUnderTest.supportsInterface(interfaceId)).to.equal(
          false
        );
      });
    }
  });
}

module.exports = {
  shouldSupportInterfaces,
  shouldNotSupportInterfaces,
};

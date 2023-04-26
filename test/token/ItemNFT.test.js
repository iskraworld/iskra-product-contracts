const { expect } = require("chai");
const { ethers } = require("hardhat");
const { AddressZero } = ethers.constants;

const {
  shouldNotSupportInterfaces,
  shouldSupportInterfaces,
} = require("./common/SupportInterface.behavior");

const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
} = require("./ERC721/ERC721.behavior");

describe("ItemNFT", function () {
  let ItemNFT;
  const name = "Item NFT";
  const symbol = "iNFT";
  const uri = "https://token.uri/";
  const firstTokenId = 1;
  const secondTokenId = 2;

  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    ItemNFT = await ethers.getContractFactory("ItemNFT");

    this.token = this.contract = await ItemNFT.connect(this.signers[0]).deploy(
      name,
      symbol,
      uri,
      true
    );
  });

  shouldSupportInterfaces(["ERC165", "ERC721", "ERC721Metadata"]);
  shouldNotSupportInterfaces(["ERC20"]);

  describe("ERC721", function () {
    shouldBehaveLikeERC721();
    shouldBehaveLikeERC721Metadata(name, symbol, uri);
  });

  describe("setBaseURI", function () {
    const newURI = "https://new.uri/";
    let owner, other;

    beforeEach(async function () {
      [owner, other] = this.signers;
      expect(await this.contract.safeMint(other.address, firstTokenId)).emit(
        this.contract,
        "Transfer"
      );
    });

    it("changes base uri and emits the eventlog", async function () {
      await expect(this.contract.setBaseURI(newURI)).not.reverted;
      expect(await this.contract.tokenURI(1)).to.be.equal(
        newURI + firstTokenId
      );
    });

    it("reverts when the sender is not owner", async function () {
      await expect(
        this.contract.connect(other).setBaseURI(newURI)
      ).revertedWith("Ownable: caller is not the owner");
      expect(await this.contract.tokenURI(1)).to.be.equal(uri + firstTokenId);
    });
  });

  describe("mint", function () {
    let contract;
    let owner, other;

    beforeEach(async function () {
      [owner, other] = this.signers;
      contract = this.contract;
    });

    it("mints a token properly if tx sender is the owner", async function () {
      await expect(
        contract.connect(owner).safeMint(other.address, firstTokenId)
      )
        .emit(contract, "Transfer")
        .withArgs(AddressZero, other.address, firstTokenId);
    });

    it("mints a token properly if tx sender is the minter", async function () {
      await expect(contract.setMintApproval(other.address, true))
        .emit(contract, "MintApproval")
        .withArgs(other.address, true);

      await expect(
        contract.connect(other).safeMint(other.address, firstTokenId)
      )
        .emit(contract, "Transfer")
        .withArgs(AddressZero, other.address, firstTokenId);
    });

    it("reverts with a null destination address", async function () {
      await expect(contract.safeMint(AddressZero, firstTokenId)).revertedWith(
        "ERC721: mint to the zero address"
      );
    });

    it("reverts if tx sender is not the owner", async function () {
      await expect(
        contract.connect(other).safeMint(other.address, firstTokenId)
      ).revertedWith("ItemNFT: the sender does not have permission to mint");
    });
  });

  describe("burn", function () {
    let contract;
    let owner, other;

    beforeEach(async function () {
      [owner, other] = this.signers;
      contract = this.contract;

      await expect(
        contract.connect(owner).safeMint(owner.address, firstTokenId)
      )
        .emit(contract, "Transfer")
        .withArgs(AddressZero, owner.address, firstTokenId);

      await expect(
        contract.connect(owner).safeMint(other.address, secondTokenId)
      )
        .emit(contract, "Transfer")
        .withArgs(AddressZero, other.address, secondTokenId);
    });

    it("burns properly if tx sender is the owner", async function () {
      await expect(contract.connect(owner).burn(firstTokenId))
        .emit(contract, "Transfer")
        .withArgs(owner.address, AddressZero, firstTokenId);
    });

    it("burns properly if tx sender has permission", async function () {
      await expect(contract.connect(owner).setBurnApproval(other.address, true))
        .not.reverted;

      await expect(contract.connect(other).burn(secondTokenId))
        .emit(contract, "Transfer")
        .withArgs(other.address, AddressZero, secondTokenId);
    });

    it("reverts if the token is not burnable", async function () {
      contract = await ItemNFT.connect(owner).deploy(name, symbol, uri, false);

      await expect(contract.connect(owner).burn(firstTokenId)).revertedWith(
        "ItemNFT: the token is not burnable"
      );
    });

    it("reverts if the sender does not have permission", async function () {
      await expect(contract.connect(other).burn(firstTokenId)).revertedWith(
        "ItemNFT: the sender does not have permission to burn"
      );
    });

    it("reverts if burning non-owned token", async function () {
      await expect(contract.connect(owner).burn(secondTokenId)).revertedWith(
        "ERC721: caller is not token owner or approved"
      );
    });
  });

  describe("setBurnApproval", function () {
    let contract;
    let owner, other;

    beforeEach(async function () {
      contract = this.contract;
      [owner, other] = this.signers;

      expect(await contract.safeMint(other.address, firstTokenId)).emit(
        this.contract,
        "Transfer"
      );
    });

    it("approve properly if sender is owner", async function () {
      await expect(contract.setBurnApproval(other.address, true))
        .emit(contract, "BurnApproval")
        .withArgs(other.address, true);
      expect(await contract.burnApprovals(other.address)).to.be.equal(true);
    });

    it("reverts when the sender is not owner", async function () {
      await expect(
        contract.connect(other).setBurnApproval(other.address, true)
      ).revertedWith("Ownable: caller is not the owner");
    });

    it("reverts when the token is not burnable", async function () {
      contract = await ItemNFT.connect(owner).deploy(name, symbol, uri, false);

      await expect(
        contract.connect(owner).setBurnApproval(other.address, true)
      ).revertedWith("ItemNFT: the token is not burnable");
    });
  });

  describe("setMintApproval", function () {
    let contract;
    let owner, other;

    beforeEach(async function () {
      contract = this.contract;
      [owner, other] = this.signers;
    });

    it("approve properly if sender is owner", async function () {
      await expect(contract.setMintApproval(other.address, true))
        .emit(contract, "MintApproval")
        .withArgs(other.address, true);
      expect(await contract.mintApprovals(other.address)).to.be.equal(true);
    });

    it("reverts when the sender is not owner", async function () {
      await expect(
        contract.connect(other).setMintApproval(other.address, true)
      ).revertedWith("Ownable: caller is not the owner");
    });
  });
});

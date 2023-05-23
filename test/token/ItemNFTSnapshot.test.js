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
  shouldBehaveLikeERC721Enumerable,
} = require("./ERC721/ERC721.behavior");

describe("ItemNFTSnapshot", function () {
  let ItemNFT;
  const name = "Item NFT";
  const symbol = "iNFT";
  const uri = "https://token.uri/";
  const firstTokenId = 1;
  const secondTokenId = 2;

  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    ItemNFT = await ethers.getContractFactory("ItemNFTSnapshot");

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
    shouldBehaveLikeERC721Enumerable();
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
      ).revertedWith(
        "ItemNFTSnapshot: the sender does not have permission to mint"
      );
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
        "ItemNFTSnapshot: the token is not burnable"
      );
    });

    it("reverts if the sender does not have permission", async function () {
      await expect(contract.connect(other).burn(firstTokenId)).revertedWith(
        "ItemNFTSnapshot: the sender does not have permission to burn"
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
      ).revertedWith("ItemNFTSnapshot: the token is not burnable");
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

  describe("Snapshot", function () {
    let mintDate;
    const tokenId = 100;

    let contract;
    let owner, other;

    beforeEach(async function () {
      contract = this.contract;
      [owner, other] = this.signers;
      const block = await ethers.provider.getBlock("latest");
      mintDate = new Date(block.timestamp * 1000);
      mintDate.setDate(mintDate.getDate() + 1);

      await ethers.provider.send("evm_mine", [
        getTimestamp(mintDate, 10), // AM 10:00
      ]);

      await expect(contract.safeMint(other.address, tokenId)).not.reverted;
    });

    it("reverts if query snapshots for future times", async function () {
      const date = new Date(mintDate);
      await ethers.provider.send("evm_mine", [
        getTimestamp(date, 11), // AM 11:00
      ]);

      await expect(
        contract.ownerOfAt(
          tokenId,
          getTimestamp(date, 12) // PM 12:00
        )
      ).revertedWith(
        "ItemNFTSnapshot: cannot query snapshots for future times"
      );

      await expect(
        contract.balanceOfAt(
          other.address,
          getTimestamp(date, 12) // PM 12:00
        )
      ).revertedWith(
        "ItemNFTSnapshot: cannot query snapshots for future times"
      );
    });

    it("returns the state before mint if before 0:00 the next day", async function () {
      const date = new Date(mintDate);
      await ethers.provider.send("evm_mine", [
        getTimestamp(date, 12), // PM 12:00
      ]);
      const currBalance = await contract.balanceOf(other.address);
      const balance = await contract.balanceOfAt(
        other.address,
        getTimestamp(date, 11) // AM 11:00
      );
      expect(balance).equal(0);

      await expect(
        contract.ownerOfAt(
          tokenId,
          getTimestamp(date, 11) // AM 11:00
        )
      ).revertedWith("ERC721Snapshot: invalid token ID");
    });

    it("returns the state after mint if after 0:00 the next day", async function () {
      const date = new Date(mintDate);
      date.setDate(date.getDate() + 1);

      await ethers.provider.send("evm_mine", [
        getTimestamp(date, 0), // next day AM 1:00
      ]);
      let balance = await contract.balanceOfAt(
        other.address,
        getTimestamp(date, 0) // next day AM 0:00
      );
      expect(balance).equal(1);

      let owner = await contract.ownerOfAt(
        tokenId,
        getTimestamp(date, 0) // next day AM 0:00
      );
      expect(owner).eq(other.address);

      await ethers.provider.send("evm_mine", [
        getTimestamp(date, 1), // next day AM 1:00
      ]);
      balance = await contract.balanceOfAt(
        other.address,
        getTimestamp(date, 1) // next day AM 1:00
      );
      expect(balance).equal(1);

      owner = await contract.ownerOfAt(
        tokenId,
        getTimestamp(date, 1) // next day AM 1:00
      );
      expect(owner).eq(other.address);
    });
  });

  describe("Multiple Snapshots", function () {
    let mintDates = [];
    const tokenId = 100;

    let contract;
    let owner, other;

    beforeEach(async function () {
      contract = this.contract;
      [owner, other] = this.signers;
      const block = await ethers.provider.getBlock("latest");
      let prevDate = new Date(block.timestamp * 1000);
      for (let i = 0; i < 5; i++) {
        const date = new Date(prevDate);
        date.setDate(date.getDate() + 1);

        await ethers.provider.send("evm_mine", [getTimestamp(date, 10)]);

        await expect(contract.safeMint(other.address, tokenId + i)).not
          .reverted;

        mintDates.push(date);
        prevDate = date;
      }
    });

    it("returns proper snapshot states for each timestamp", async function () {
      for (let i = 0; i < mintDates.length; i++) {
        const balance = await contract.balanceOfAt(
          other.address,
          getTimestamp(mintDates[i], 1)
        );
        expect(balance).equal(i);

        for (let tId = tokenId; tId < tokenId + i; tId++) {
          owner = await contract.ownerOfAt(tId, getTimestamp(mintDates[i], 1));
          expect(owner).eq(other.address);
        }
      }
    });
  });
});

function getTimestamp(date, hours) {
  return Math.floor(date.setUTCHours(hours, 0, 0, 0) / 1000);
}

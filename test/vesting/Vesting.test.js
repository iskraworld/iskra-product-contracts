const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");
const { constants } = require("@openzeppelin/test-helpers");

describe("Vesting contract", function () {
  const VestingStatus = {
    CREATED: 0,
    PREPARED: 1,
    ACTIVE: 2,
    REVOKED: 3,
  };
  const time_2022_01_14_15_14_02 = 1642140842;
  const time_2025_01_13_15_14_02 = 1736748842;
  const time_2100_01_01 = 4102412400;
  const time_2000_01_01 = 946652400;
  const time_2023_01_01 = 1672498800;

  // Notice:
  // evm_setNextBlockTimestamp throws an error if params is less than current time. So we use the time after 3022.
  // This test will not fail until 3022 years!
  const time_3022_01_14 = 33199027200;
  const time_3023_01_14 = 33230563200;
  const time_3025_01_14 = 33293721600;
  const time_3022_01_01 = 33197904000;
  const time_3022_03_05 = 33203347200;
  const period = 2628000;

  let GameToken;
  let gameToken;
  let Vesting;
  let vesting;
  let owner;
  let beneficiary1;
  let beneficiary2;
  let beacon;
  let proxy;
  let proxyMode = true; // if you want to test with beacon upgradeable and beacon proxy then you should set it to true.

  function toTokenAmount(amount) {
    return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
  }

  beforeEach(async function () {
    [owner, beneficiary1, beneficiary2, secondOwner] =
      await ethers.getSigners();
    GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy(
      "Game Token",
      "GGT",
      toTokenAmount(1_000_000_000)
    );
    await gameToken.deployed();
    Vesting = await ethers.getContractFactory("Vesting");
    if (proxyMode) {
      beacon = await upgrades.deployBeacon(Vesting);
      beacon.deployed();
      proxy = await upgrades.deployBeaconProxy(beacon, Vesting, []);
      proxy.deployed();
      vesting = Vesting.attach(proxy.address);
    } else {
      vesting = await Vesting.deploy();
      await vesting.deployed();
      await vesting.initialize();
    }
  });

  describe("prepare()", function () {
    it("normal initialization", async function () {
      expect(await vesting.status()).to.equal(VestingStatus.CREATED);

      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        )
      )
        .to.emit(vesting, "Prepared")
        .withArgs(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        );
      expect(await gameToken.balanceOf(beneficiary1.address)).to.equal(0);

      expect(await vesting.beneficiary()).to.equal(beneficiary1.address);
      expect(await vesting.start()).to.equal(0);
      expect(await vesting.end()).to.equal(0);
      expect(await vesting.duration()).to.equal(36);
      expect(await vesting.initialVestingAmount()).to.equal(300_000);
      expect(await vesting.claimedAmount()).to.equal(0);
      expect(await vesting.status()).to.equal(VestingStatus.PREPARED);
    });

    it("invalid initialization; zero address for a beneficiary", async function () {
      await expect(
        vesting.prepare(
          owner.address,
          constants.ZERO_ADDRESS,
          300_000,
          0,
          730,
          36,
          gameToken.address
        )
      ).to.be.revertedWith("Vesting: `_beneficiary` is zero address(0)");
    });

    it("invalid initialization; token not approved", async function () {
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        )
      ).to.be.reverted;
    });

    it("invalid initialization; approved insufficient", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(200_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        )
      ).to.be.reverted;
    });

    it("invalid initialization; zero token address", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          constants.ZERO_ADDRESS
        )
      ).to.be.reverted;
    });

    it("invalid initialization; invalid period", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          0,
          36,
          gameToken.address
        )
      ).to.be.reverted;
    });

    it("invalid initialization; invalid duration", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          0,
          gameToken.address
        )
      ).to.be.reverted;
    });

    it("invalid initialization; invalid duration2", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(59));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          59,
          0,
          730,
          60,
          gameToken.address
        )
      ).to.be.reverted;
    });

    it("invalid initialization; zero amount", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          0,
          0,
          730,
          36,
          gameToken.address
        )
      ).to.be.revertedWith("Vesting: _amount must be greater than _duration");
    });

    it("invalid initialization; non-token address", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          vesting.address
        )
      ).to.be.reverted;
    });

    it("invalid initialization; not approved owner", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting
          .connect(beneficiary1)
          .prepare(
            owner.address,
            beneficiary1.address,
            300_000,
            0,
            730,
            36,
            vesting.address
          )
      ).to.be.reverted;
    });
  });

  describe("setStart()", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
    });

    it("normal setStart", async function () {
      await expect(vesting.setStart(time_2022_01_14_15_14_02))
        .to.emit(vesting, "SetStart")
        .withArgs(time_2022_01_14_15_14_02);
      expect(await vesting.start()).to.equal(time_2022_01_14_15_14_02);
      expect(await vesting.end()).to.equal(time_2025_01_13_15_14_02);
    });

    it("revoked", async function () {
      await vesting.revoke(owner.address);
      await expect(
        vesting.setStart(time_2022_01_14_15_14_02)
      ).to.be.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
    });

    it("zero start time", async function () {
      await expect(vesting.setStart(0)).to.be.revertedWith(
        "Vesting: `_start` is 0"
      );
    });

    it("setStart twice", async function () {
      await vesting.setStart(time_2022_01_14_15_14_02);
      await expect(vesting.setStart(0)).to.be.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
    });

    it("not owner", async function () {
      await expect(
        vesting.connect(beneficiary1).setStart(time_2022_01_14_15_14_02)
      ).to.be.reverted;
    });
  });

  describe("revoke(): success cases", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(1_000_000_000 - 300_000)
      );
    });

    afterEach(async function () {
      expect(await vesting.status()).to.equal(VestingStatus.REVOKED);
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(1_000_000_000)
      );
      expect(await gameToken.balanceOf(vesting.address)).to.equal(0);
    });

    it("revoke prepared vesting", async function () {
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
    });

    it("revoke vesting that has start time, but is not started yet", async function () {
      await vesting.setStart(time_2100_01_01);
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
    });

    it("revoke vesting that has start time and already ends", async function () {
      await vesting.setStart(time_2000_01_01);
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
    });

    it("revoke vesting that has start time and does not end", async function () {
      await vesting.setStart(time_2023_01_01);
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
    });

    it("revoke twice", async function () {
      await vesting.revoke(owner.address);
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
    });
  });

  describe("revoke(): verifying balance", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(1_000_000_000 - 300_000)
      );
    });

    afterEach(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    it("revoke after claiming some amount", async function () {
      await vesting.setStart(time_3022_01_14);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3023_01_14,
      ]);
      await ethers.provider.send("evm_mine");
      await vesting.connect(beneficiary1).claim(100_000);
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(999_900_000)
      );
      expect(await gameToken.balanceOf(beneficiary1.address)).to.equal(
        toTokenAmount(100_000)
      );
      expect(await gameToken.balanceOf(vesting.address)).to.equal(0);
    });

    it("revoke after claiming all amount", async function () {
      await vesting.setStart(time_3022_01_14);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3025_01_14,
      ]);
      await ethers.provider.send("evm_mine");
      await vesting.connect(beneficiary1).claim(300_000);
      // revoking succeeds, but taking back nothing
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(999_700_000)
      );
      expect(await gameToken.balanceOf(beneficiary1.address)).to.equal(
        toTokenAmount(300_000)
      );
      expect(await gameToken.balanceOf(vesting.address)).to.equal(0);
    });

    it("take back miss-transferred balance as well", async function () {
      await vesting.setStart(time_3022_01_14);
      await gameToken.transfer(vesting.address, toTokenAmount(100_000)); // miss transferring!
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(999_600_000)
      );
      expect(await gameToken.balanceOf(vesting.address)).to.equal(
        toTokenAmount(400_000)
      );

      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3025_01_14,
      ]);
      await ethers.provider.send("evm_mine");
      await vesting.connect(beneficiary1).claim(300_000);
      await expect(vesting.revoke(owner.address))
        .to.emit(vesting, "Revoked")
        .withArgs(owner.address);
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        toTokenAmount(999_700_000)
      );
      expect(await gameToken.balanceOf(beneficiary1.address)).to.equal(
        toTokenAmount(300_000)
      );
      expect(await gameToken.balanceOf(vesting.address)).to.equal(0);
    });
  });

  describe("revoke(): failure cases", function () {
    it("not set up vesting", async function () {
      await expect(vesting.revoke(owner.address)).to.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
    });
  });

  describe("claim(): success cases", function () {
    async function testClaim(
      vestingAmount,
      times,
      passedTime,
      expectedClaimablAmount
    ) {
      await gameToken.approve(vesting.address, toTokenAmount(vestingAmount));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        vestingAmount,
        0,
        730,
        times,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_14);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_14 + passedTime,
      ]);
      await ethers.provider.send("evm_mine");

      // now the beneficiary can claim the amount as long as it has passed.
      if (expectedClaimablAmount > 0) {
        await expect(
          vesting.connect(beneficiary1).claim(expectedClaimablAmount)
        )
          .to.emit(vesting, "Claimed")
          .withArgs(expectedClaimablAmount);
      }
      expect(await gameToken.balanceOf(beneficiary1.address)).to.equal(
        toTokenAmount(expectedClaimablAmount)
      );
      expect(await vesting.getClaimableAmount()).to.equal(0);
      expect(await vesting.getUnlockedAmount()).to.equal(
        expectedClaimablAmount
      );
      expect(await vesting.getLockedAmount()).to.equal(
        vestingAmount - expectedClaimablAmount
      );
    }

    afterEach(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    it("300,000 vesting during 36 months, one period - 10sec passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const expectedClaimableAmount = 0;
      await testClaim(
        vestingAmount,
        times,
        period - 10,
        expectedClaimableAmount
      );
    });

    it("300,000 vesting during 36 months, 1 period passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount = ~~(vestingAmount / times) + remainder;
      await testClaim(vestingAmount, times, period, expectedClaimableAmount);
    });

    it("300,000 vesting during 36 months, 1 period + 1sec passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount = ~~(vestingAmount / times) + remainder;
      await testClaim(
        vestingAmount,
        times,
        period + 1,
        expectedClaimableAmount
      );
    });

    it("300,000 vesting during 36 months, 2 periods passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const passedTimes = 2;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount =
        ~~(vestingAmount / times) * passedTimes + remainder;
      await testClaim(
        vestingAmount,
        times,
        period * passedTimes,
        expectedClaimableAmount
      );
    });

    it("300,000 vesting during 36 months, 36 periods - 10sec passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const passedTimes = 36;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount =
        ~~(vestingAmount / times) * (passedTimes - 1) + remainder;
      await testClaim(
        vestingAmount,
        times,
        period * passedTimes - 10,
        expectedClaimableAmount
      );
    });

    it("300,000 vesting during 36 months, 36 periods passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const passedTimes = 36;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount =
        ~~(vestingAmount / times) * passedTimes + remainder;
      await testClaim(
        vestingAmount,
        times,
        period * passedTimes,
        expectedClaimableAmount
      );
    });

    it("300,000 vesting during 36 months, 36 periods + 1sec passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const passedTimes = 36;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount =
        ~~(vestingAmount / times) * passedTimes + remainder;
      await testClaim(
        vestingAmount,
        times,
        period * passedTimes + 1,
        expectedClaimableAmount
      );
    });

    it("300,000 vesting during 36 months, 37 periods passed", async function () {
      const vestingAmount = 300_000;
      const times = 36;
      const passedTimes = 37;
      const expectedClaimableAmount = vestingAmount;
      await testClaim(
        vestingAmount,
        times,
        period * passedTimes,
        expectedClaimableAmount
      );
    });

    it("1000 vesting during 36 months, 1 period passed", async function () {
      const vestingAmount = 1000;
      const times = 36;
      const remainder = vestingAmount - ~~(vestingAmount / times) * times;
      const expectedClaimableAmount = ~~(vestingAmount / times) + remainder;
      await testClaim(vestingAmount, times, period, expectedClaimableAmount);
    });

    it("36 vesting during 36 months, 1 period passed", async function () {
      const vestingAmount = 36;
      const times = 36;
      const expectedClaimableAmount = 1;
      await testClaim(vestingAmount, times, period, expectedClaimableAmount);
    });

    it("1_000_000 vesting during 60 months, 1 period passed", async function () {
      const vestingAmount = 1_000_000;
      const times = 60;
      const expectedClaimableAmount = 16666 + 40; // remainder = 40
      await testClaim(vestingAmount, times, period, expectedClaimableAmount);
    });

    it("1_000_000 vesting during 60 months, 60 periods passed", async function () {
      const vestingAmount = 1_000_000;
      const times = 60;
      const expectedClaimableAmount = 1_000_000;
      await testClaim(
        vestingAmount,
        times,
        period * 60,
        expectedClaimableAmount
      );
    });
  });

  describe("claim(): normal case", function () {
    it("claiming per every month", async function () {
      let time = time_3022_01_14;

      await gameToken.approve(vesting.address, toTokenAmount(400_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        400_000,
        0,
        730,
        36,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_14);
      let expectedClaimed = 0;
      let remainder = 400_000 - ~~(400_000 / 36) * 36;
      for (let i = 1; i <= 36; i++) {
        time += period; // one month passed
        await ethers.provider.send("evm_setNextBlockTimestamp", [time]);
        await ethers.provider.send("evm_mine");
        let expectedAmount = ~~(400_000 / 36) * i + remainder;
        let claimableAtThisTime = expectedAmount - expectedClaimed;
        expect(await vesting.getClaimableAmount()).to.be.equal(
          claimableAtThisTime
        );
        await expect(vesting.connect(beneficiary1).claim(claimableAtThisTime))
          .to.emit(vesting, "Claimed")
          .withArgs(claimableAtThisTime);
        expectedClaimed += claimableAtThisTime;
        expect(await vesting.getClaimableAmount()).to.be.equal(0);
        expect(await vesting.getUnlockedAmount()).to.be.equal(expectedClaimed);
      }
      expect(await vesting.getLockedAmount()).to.be.equal(0);
      expect(await gameToken.balanceOf(owner.address)).to.be.equal(
        toTokenAmount(999_600_000)
      );
      expect(await gameToken.balanceOf(beneficiary1.address)).to.be.equal(
        toTokenAmount(400_000)
      );
      await ethers.provider.send("hardhat_reset");
    });
  });

  describe("claim(): failure cases", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_01);
    });

    after(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    it("not a beneficiary", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_03_05,
      ]);
      await ethers.provider.send("evm_mine");
      await expect(vesting.connect(beneficiary2).claim(10)).to.revertedWith(
        "Vesting: the caller is not the beneficiary"
      );
    });

    it("zero amount", async function () {
      await expect(vesting.connect(beneficiary1).claim(0)).to.revertedWith(
        "Vesting: `_amount` is 0"
      );
    });

    it("insufficient funds", async function () {
      await expect(
        vesting.connect(beneficiary1).claim(100_000)
      ).to.revertedWith("Vesting: insufficient funds");
    });
  });

  describe("changeBeneficiary(): success case", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
    });

    after(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    it("success on not started vesting", async function () {
      await expect(
        vesting.connect(beneficiary1).changeBeneficiary(beneficiary2.address)
      )
        .to.emit(vesting, "SetBeneficiary")
        .withArgs(beneficiary2.address);
    });

    it("success on started vesting", async function () {
      await vesting.setStart(time_3022_01_01);
      await expect(
        vesting.connect(beneficiary1).changeBeneficiary(beneficiary2.address)
      )
        .to.emit(vesting, "SetBeneficiary")
        .withArgs(beneficiary2.address);
    });

    it("combination of claiming and change beneficiary", async function () {
      await vesting.setStart(time_3022_01_01);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_03_05,
      ]);
      await ethers.provider.send("evm_mine");
      await vesting.connect(beneficiary1).claim(100);
      expect(await gameToken.balanceOf(beneficiary1.address)).to.be.equal(
        toTokenAmount(100)
      );
      await expect(
        vesting.connect(beneficiary1).changeBeneficiary(beneficiary2.address)
      )
        .to.emit(vesting, "SetBeneficiary")
        .withArgs(beneficiary2.address);
      await vesting.connect(beneficiary2).claim(100);
      expect(await gameToken.balanceOf(beneficiary2.address)).to.be.equal(
        toTokenAmount(100)
      );
      await expect(
        vesting.connect(beneficiary2).changeBeneficiary(beneficiary1.address)
      )
        .to.emit(vesting, "SetBeneficiary")
        .withArgs(beneficiary1.address);
      await vesting.connect(beneficiary1).claim(100);
      expect(await gameToken.balanceOf(beneficiary1.address)).to.be.equal(
        toTokenAmount(200)
      );
    });

    it("success with same beneficiary", async function () {
      await expect(
        vesting.connect(beneficiary1).changeBeneficiary(beneficiary1.address)
      )
        .to.emit(vesting, "SetBeneficiary")
        .withArgs(beneficiary1.address);
    });
  });

  describe("changeBeneficiary(): failure case", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
    });

    after(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    it("not the beneficiary", async function () {
      await expect(
        vesting.connect(beneficiary2).changeBeneficiary(beneficiary2.address)
      ).to.revertedWith("Vesting: the caller is not the beneficiary");
    });
  });

  describe("view functions(): failure cases", function () {
    after(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    async function confirmViewFunctionsToBeFailed() {
      await expect(vesting.getNextUnlock()).to.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
      await expect(vesting.getClaimableAmount()).to.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
      await expect(vesting.getUnlockedAmount()).to.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
      await expect(vesting.getLockedAmount()).to.revertedWith(
        "Vesting: not in a status in which the operation can be executed"
      );
    }

    it("not set up", async function () {
      await confirmViewFunctionsToBeFailed();
    });

    it("not started", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      await confirmViewFunctionsToBeFailed();
    });

    it("already revoked", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_01);
      await vesting.revoke(owner.address);
      await confirmViewFunctionsToBeFailed();
    });

    it("last unlock time passed", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_01);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01 + period * 36,
      ]);
      await ethers.provider.send("evm_mine");
      await expect(vesting.getNextUnlock()).to.revertedWith(
        "Vesting: there's no remaining unlock time"
      );
    });
  });

  describe("view functions(): success cases", function () {
    beforeEach(async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        300_000,
        0,
        730,
        36,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_01);
    });

    after(async function () {
      await ethers.provider.send("hardhat_reset");
    });

    async function verifyViewFunctions(next, claimable, unlocked, locked) {
      expect(await vesting.getNextUnlock()).to.be.equal(next);
      expect(await vesting.getClaimableAmount()).to.be.equal(claimable);
      expect(await vesting.getUnlockedAmount()).to.be.equal(unlocked);
      expect(await vesting.getLockedAmount()).to.be.equal(locked);
    }

    it("right before start time", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01 - 10,
      ]);
      await ethers.provider.send("evm_mine");
      verifyViewFunctions(time_3022_01_01 + period, 0, 0, 300_000);
    });

    it("exact start time", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01,
      ]);
      await ethers.provider.send("evm_mine");
      verifyViewFunctions(time_3022_01_01 + period, 0, 0, 300_000);
    });

    it("right after start time", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01 + 10,
      ]);
      await ethers.provider.send("evm_mine");
      verifyViewFunctions(time_3022_01_01 + period, 0, 0, 300_000);
    });

    it("after one period", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01 + period,
      ]);
      await ethers.provider.send("evm_mine");
      verifyViewFunctions(
        time_3022_01_01 + period * 2,
        8333 + 12,
        8333 + 12,
        300_000 - 8333 - 12
      );
    });

    it("after one period and claiming", async function () {
      await vesting.connect(beneficiary1).claim(5000);
      verifyViewFunctions(
        time_3022_01_01 + period * 2,
        3333 + 12,
        8333 + 12,
        300_000 - 8333 - 12
      );
    });

    it("right before last unlock time", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01 + period * 36 - 10,
      ]);
      await ethers.provider.send("evm_mine");
      verifyViewFunctions(
        time_3022_01_01 + period * 36,
        300_000 - 8333,
        300_000 - 8333,
        8333
      );
    });

    it("after last unlock time", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_01 + period * 36,
      ]);
      await ethers.provider.send("evm_mine");
      expect(await vesting.getClaimableAmount()).to.be.equal(300_000);
      expect(await vesting.getUnlockedAmount()).to.be.equal(300_000);
      expect(await vesting.getLockedAmount()).to.be.equal(0);
    });
  });

  describe("transfer ownership", function () {
    it("success or failure case: transfer ownership before initializing", async function () {
      await vesting.transferOwnership(secondOwner.address);
      await gameToken.transfer(secondOwner.address, toTokenAmount(300_000));
      await gameToken
        .connect(secondOwner)
        .approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        )
      ).to.reverted;
      await expect(
        vesting
          .connect(secondOwner)
          .prepare(
            secondOwner.address,
            beneficiary1.address,
            300_000,
            0,
            730,
            36,
            gameToken.address
          )
      )
        .to.emit(vesting, "Prepared")
        .withArgs(
          secondOwner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        );
      await expect(vesting.connect(secondOwner).setStart(time_3022_01_01))
        .to.emit(vesting, "SetStart")
        .withArgs(time_3022_01_01);
      await expect(vesting.revoke(owner.address)).to.reverted;
      await vesting.connect(secondOwner).revoke(secondOwner.address);
      expect(await gameToken.balanceOf(secondOwner.address)).to.be.equal(
        toTokenAmount(300_000)
      );
    });

    it("success case: transfer ownership after initializing", async function () {
      await gameToken.approve(vesting.address, toTokenAmount(300_000));
      await expect(
        vesting.prepare(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        )
      )
        .to.emit(vesting, "Prepared")
        .withArgs(
          owner.address,
          beneficiary1.address,
          300_000,
          0,
          730,
          36,
          gameToken.address
        );
      await vesting.transferOwnership(secondOwner.address);
      await expect(vesting.setStart(time_3022_01_01)).to.reverted;
      await expect(vesting.connect(secondOwner).setStart(time_3022_01_01))
        .to.emit(vesting, "SetStart")
        .withArgs(time_3022_01_01);
      await expect(vesting.revoke(owner.address)).to.reverted;
      await vesting.connect(secondOwner).revoke(secondOwner.address);
      expect(await gameToken.balanceOf(secondOwner.address)).to.be.equal(
        toTokenAmount(300_000)
      );
    });
  });

  describe("initial unlocked amount test", function () {
    async function prepareWithInitialAndClaim(
      vestingAmount,
      initialAmount,
      passedTime,
      expectedClaimablAmount
    ) {
      await gameToken.approve(vesting.address, toTokenAmount(vestingAmount));
      await vesting.prepare(
        owner.address,
        beneficiary1.address,
        vestingAmount,
        initialAmount,
        730,
        36,
        gameToken.address
      );
      await vesting.setStart(time_3022_01_14);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        time_3022_01_14 + passedTime,
      ]);
      await ethers.provider.send("evm_mine");

      // now the beneficiary can claim the amount as long as it has passed.
      if (expectedClaimablAmount > 0) {
        await expect(
          vesting.connect(beneficiary1).claim(expectedClaimablAmount)
        )
          .to.emit(vesting, "Claimed")
          .withArgs(expectedClaimablAmount);
      }
      expect(await gameToken.balanceOf(beneficiary1.address)).to.equal(
        toTokenAmount(expectedClaimablAmount)
      );
      expect(await vesting.getClaimableAmount()).to.equal(0);
      expect(await vesting.getUnlockedAmount()).to.equal(
        expectedClaimablAmount
      );
      expect(await vesting.getLockedAmount()).to.equal(
        vestingAmount - expectedClaimablAmount
      );
    }

    it("100,000 initial unlocked, one period - 10sec passed", async function () {
      const vestingAmount = 300_000;
      const initailAmount = 100_000;
      const expectedClaimableAmount = initailAmount;
      await prepareWithInitialAndClaim(
        vestingAmount,
        initailAmount,
        period - 10,
        expectedClaimableAmount
      );
    });

    it("100,000 initial unlocked, one period + 10sec passed", async function () {
      const vestingAmount = 300_000;
      const initailAmount = 100_000;
      const locked = vestingAmount - initailAmount;
      const remainder = locked - ~~(locked / 36) * 36;
      const expectedClaimableAmount =
        initailAmount + ~~(locked / 36) + remainder;
      await prepareWithInitialAndClaim(
        vestingAmount,
        initailAmount,
        period + 10,
        expectedClaimableAmount
      );
    });
  });
});

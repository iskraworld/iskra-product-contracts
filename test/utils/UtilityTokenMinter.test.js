const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { constants } = require("ethers");
const { defaultAbiCoder } = require("ethers/lib/utils");

const ZERO_ADDRESS = constants.AddressZero;
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
const MONTH_IN_HOURS = 24 * 30;
const VESTING_DURATION = 36;

describe("UtilityTokenMinter", () => {
  const MILLION = 1_000_000;
  const SHARE_PER_MILLION = 50_000;

  let deployer;
  let shareRecipient;
  let operator;
  let other;

  let minter;
  let token;
  let paymentToken;
  let beacon;

  let tokenFactory;
  let vestingFactory;
  let utilityTokenMinterFactory;

  beforeEach(async () => {
    [deployer, shareRecipient, operator, other] = await ethers.getSigners();

    tokenFactory = await ethers.getContractFactory("UtilityToken");
    token = await tokenFactory.deploy("UtilityToken", "UT", deployer.address);
    await token.deployed();

    paymentToken = await tokenFactory.deploy(
      "PaymentToken",
      "PT",
      deployer.address
    );
    await paymentToken.deployed();
    await paymentToken.mint(operator.address, 10000n * 10n ** 18n);

    vestingFactory = await ethers.getContractFactory("Vesting");
    beacon = await upgrades.deployBeacon(vestingFactory);
    await beacon.deployed();

    utilityTokenMinterFactory = await ethers.getContractFactory(
      "UtilityTokenMinter"
    );
    minter = await utilityTokenMinterFactory.deploy(
      token.address,
      paymentToken.address,
      DEAD_ADDRESS,
      shareRecipient.address,
      SHARE_PER_MILLION,
      beacon.address,
      MONTH_IN_HOURS,
      VESTING_DURATION
    );
    await minter.deployed();

    await token.addMinter(minter.address);
  });

  afterEach(async function () {
    await ethers.provider.send("hardhat_reset", []);
  });

  describe("initialize", () => {
    it("succeeds for proper init args", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        DEAD_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        beacon.address,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).not.reverted;

      const minter = await tx;
      expect(await minter.token()).eq(token.address);
      expect(await minter.paymentToken()).eq(paymentToken.address);
      expect(await minter.treasury()).eq(DEAD_ADDRESS);
      expect(await minter.shareRecipient()).eq(shareRecipient.address);
      expect(await minter.sharePerMillion()).eq(SHARE_PER_MILLION);
      expect(await minter.vestingBeacon()).eq(beacon.address);
      expect(await minter.unlockPeriodHours()).eq(MONTH_IN_HOURS);
      expect(await minter.vestingDuration()).eq(VESTING_DURATION);
    });

    it("reverts if zero address token", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        ZERO_ADDRESS,
        paymentToken.address,
        DEAD_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        beacon.address,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid token");
    });

    it("reverts if zero address paymentToken", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        ZERO_ADDRESS,
        DEAD_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        beacon.address,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid paymentToken");
    });

    it("reverts if zero address treasury", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        ZERO_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        beacon.address,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid treasury");
    });

    it("reverts if zero address shareRecipient", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        DEAD_ADDRESS,
        ZERO_ADDRESS,
        SHARE_PER_MILLION,
        beacon.address,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid shareRecipient");
    });

    it("reverts if sharePerMillion is greater than million", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        DEAD_ADDRESS,
        shareRecipient.address,
        MILLION + 1,
        beacon.address,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid sharePerMillion");
    });

    it("reverts if zero address vestingBeacon", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        DEAD_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        ZERO_ADDRESS,
        MONTH_IN_HOURS,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid vestingBeacon");
    });

    it("reverts if zero unlockPeriodHours", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        DEAD_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        beacon.address,
        0,
        VESTING_DURATION
      );
      await expect(tx).revertedWith("invalid unlockPeriodHours");
    });

    it("reverts if zero vestingDuration", async () => {
      const tx = utilityTokenMinterFactory.deploy(
        token.address,
        paymentToken.address,
        DEAD_ADDRESS,
        shareRecipient.address,
        SHARE_PER_MILLION,
        beacon.address,
        MONTH_IN_HOURS,
        0
      );
      await expect(tx).revertedWith("invalid vestingDuration");
    });
  });

  describe("mint", () => {
    it("mints the same number of tokens as the payment token", async () => {
      const amount = 10000n * 10n ** 18n;
      await expect(
        paymentToken.connect(operator).approve(minter.address, amount)
      ).not.reverted;

      const tx = minter.connect(operator).mint(operator.address, amount, false);
      const shareAmount =
        (amount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION);
      await expect(tx)
        .emit(minter, "Mint")
        .withArgs(
          operator.address,
          amount,
          shareRecipient.address,
          shareAmount,
          ZERO_ADDRESS
        );

      expect(await token.balanceOf(operator.address)).eq(amount - shareAmount);
      expect(await token.balanceOf(shareRecipient.address)).eq(shareAmount);
      expect(await paymentToken.balanceOf(DEAD_ADDRESS)).eq(amount);
    });

    it("reverts if minting zero amount", async () => {
      const amount = 0;
      const tx = minter.connect(operator).mint(operator.address, amount, false);
      await expect(tx).revertedWith("invalid amount");
    });

    describe("ERC1363 receiver", () => {
      it("supports ERC1363 receiver", async () => {
        const amount = 10000n * 10n ** 18n;
        const data = defaultAbiCoder.encode(["bool"], [false]);
        const tx = paymentToken
          .connect(operator)
          ["transferAndCall(address,uint256,bytes)"](
            minter.address,
            amount,
            data
          );
        const shareAmount =
          (amount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION);
        await expect(tx)
          .emit(minter, "Mint")
          .withArgs(
            operator.address,
            amount,
            shareRecipient.address,
            shareAmount,
            ZERO_ADDRESS
          );

        expect(await token.balanceOf(operator.address)).eq(
          amount - shareAmount
        );
        expect(await token.balanceOf(shareRecipient.address)).eq(shareAmount);
        expect(await paymentToken.balanceOf(DEAD_ADDRESS)).eq(amount);
      });

      it("reverts if invalid payment token", async () => {
        const invalidPaymentToken = await tokenFactory.deploy(
          "PaymentToken",
          "PT",
          deployer.address
        );
        await invalidPaymentToken.deployed();
        await invalidPaymentToken.mint(operator.address, 10000n * 10n ** 18n);

        const amount = 10000n * 10n ** 18n;
        const data = defaultAbiCoder.encode(["bool"], [false]);
        const tx = invalidPaymentToken
          .connect(operator)
          ["transferAndCall(address,uint256,bytes)"](
            minter.address,
            amount,
            data
          );
        await expect(tx).revertedWith("invalid caller");
      });

      it("reverts if minting zero amount", async () => {
        const amount = 0;
        const data = defaultAbiCoder.encode(["bool"], [false]);
        const tx = paymentToken
          .connect(operator)
          ["transferAndCall(address,uint256,bytes)"](
            minter.address,
            amount,
            data
          );
        await expect(tx).revertedWith("invalid amount");
      });

      it("reverts if empty transfer data", async () => {
        const amount = 10000n * 10n ** 18n;
        const tx = paymentToken
          .connect(operator)
          ["transferAndCall(address,uint256,bytes)"](
            minter.address,
            amount,
            "0x"
          );
        await expect(tx).revertedWith(
          "invalid transfer data; transfer data is empty"
        );
      });

      it("reverts if unrecognized transfer data", async () => {
        const amount = 10000n * 10n ** 18n;
        const tx = paymentToken
          .connect(operator)
          ["transferAndCall(address,uint256,bytes)"](
            minter.address,
            amount,
            "0x01"
          );
        await expect(tx).reverted;
      });
    });

    describe("mint with vesting", () => {
      it("mints the same number of tokens as the payment token", async () => {
        const amount = 10000n * 10n ** 18n;
        await expect(
          paymentToken.connect(operator).approve(minter.address, amount)
        ).not.reverted;

        const tx = await minter
          .connect(operator)
          .mint(operator.address, amount, true);
        const receipt = await tx.wait();

        const shareAmount =
          (amount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION);

        const eventFragment = minter.interface.getEvent("Mint");
        let events = receipt.logs
          .filter(
            (log) =>
              log.topics[0] == minter.interface.getEventTopic(eventFragment)
          )
          .map((log) =>
            minter.interface.decodeEventLog(eventFragment, log.data, log.topics)
          );

        expect(events[0].to).eq(operator.address);
        expect(events[0].amount).eq(amount);
        expect(events[0].shareRecipient).eq(shareRecipient.address);
        expect(events[0].shareAmount).eq(shareAmount);
        expect(events[0].vestingAddress).not.eq(ZERO_ADDRESS);

        const vesting = vestingFactory.attach(events[0].vestingAddress);
        expect(await vesting.beneficiary()).eq(minter.address);
        expect(await vesting.unlockPeriod()).eq(MONTH_IN_HOURS * 60 * 60);
        expect(await vesting.duration()).eq(VESTING_DURATION);
        expect(await vesting.unlockUnit()).eq(
          shareAmount / 10n ** 18n / BigInt(VESTING_DURATION)
        );

        expect(await token.balanceOf(operator.address)).eq(
          amount - shareAmount
        );
        expect(await token.balanceOf(shareRecipient.address)).eq(0);
        expect(await paymentToken.balanceOf(DEAD_ADDRESS)).eq(amount);
      });

      it("reverts if vesting amount has sub-decimal", async () => {
        const amount = 10n * 10n ** 18n;
        await expect(
          paymentToken.connect(operator).approve(minter.address, amount)
        ).not.reverted;

        const tx = minter
          .connect(operator)
          .mint(operator.address, amount, true);
        await expect(tx).revertedWith(
          "Vesting for sub-decimal amounts are not supported"
        );
      });
    });
  });

  describe("vesting", () => {
    const eachAmount = 720n * 10n ** 18n;
    let date;

    beforeEach(async () => {
      await expect(
        paymentToken
          .connect(operator)
          .approve(minter.address, 10000n * 10n ** 18n)
      ).not.reverted;

      // mint 4 times
      let tx = minter
        .connect(operator)
        .mint(operator.address, eachAmount, true);
      await expect(tx).not.reverted;
      tx = minter.connect(operator).mint(operator.address, eachAmount, true);
      await expect(tx).not.reverted;
      tx = minter.connect(operator).mint(operator.address, eachAmount, true);
      await expect(tx).not.reverted;
      tx = minter.connect(operator).mint(operator.address, eachAmount, true);
      await expect(tx).not.reverted;

      expect(await minter.vestingCount()).eq(4);

      const block = await ethers.provider.getBlock("latest");
      date = new Date(block.timestamp * 1000);
    });

    it("succeeds claim for all vestings", async () => {
      await ethers.provider.send("evm_mine", [
        date.setDate(date.getDate() + 30 * 1) / 1000,
      ]);

      const tx = minter.connect(shareRecipient).claimVesting(0, 4);
      const expectClaimed =
        ((eachAmount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION) / 36n) * 4n;
      await expect(tx)
        .emit(minter, "ClaimVesting")
        .withArgs(shareRecipient.address, expectClaimed);

      expect(await token.balanceOf(shareRecipient.address)).eq(expectClaimed);
    });

    it("succeeds claim for 1 ~ 3", async () => {
      await ethers.provider.send("evm_mine", [
        date.setDate(date.getDate() + 30 * 1) / 1000,
      ]);

      const tx = minter.connect(shareRecipient).claimVesting(1, 3);
      const expectClaimed =
        ((eachAmount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION) / 36n) * 3n;
      await expect(tx)
        .emit(minter, "ClaimVesting")
        .withArgs(shareRecipient.address, expectClaimed);

      expect(await token.balanceOf(shareRecipient.address)).eq(expectClaimed);
    });

    it("succeeds claim for 1 ~ 5", async () => {
      await ethers.provider.send("evm_mine", [
        date.setDate(date.getDate() + 30 * 1) / 1000,
      ]);

      const tx = minter.connect(shareRecipient).claimVesting(1, 5);
      const expectClaimed =
        ((eachAmount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION) / 36n) * 3n;
      await expect(tx)
        .emit(minter, "ClaimVesting")
        .withArgs(shareRecipient.address, expectClaimed);

      expect(await token.balanceOf(shareRecipient.address)).eq(expectClaimed);
    });

    it("succeeds claim for 4 ~ 9", async () => {
      await ethers.provider.send("evm_mine", [
        date.setDate(date.getDate() + 30 * 1) / 1000,
      ]);

      const tx = minter.connect(shareRecipient).claimVesting(4, 5);
      await expect(tx)
        .emit(minter, "ClaimVesting")
        .withArgs(shareRecipient.address, 0);

      expect(await token.balanceOf(shareRecipient.address)).eq(0);
    });

    it("skips revoked vesting without any reverts", async () => {
      await ethers.provider.send("evm_mine", [
        date.setDate(date.getDate() + 30 * 1) / 1000,
      ]);

      const vestings = await minter.vestings(0, 4);
      const revokedVesting = vestingFactory.attach(vestings.addresses[1]);
      await expect(revokedVesting.connect(deployer).revoke(deployer.address))
        .not.reverted;

      const tx = minter.connect(shareRecipient).claimVesting(0, 4);
      const expectClaimed =
        ((eachAmount * BigInt(SHARE_PER_MILLION)) / BigInt(MILLION) / 36n) * 3n;
      await expect(tx)
        .emit(minter, "ClaimVesting")
        .withArgs(shareRecipient.address, expectClaimed);

      expect(await token.balanceOf(shareRecipient.address)).eq(expectClaimed);
    });
  });
});

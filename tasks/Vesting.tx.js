const { BigNumber } = require("ethers");
const {
  printTxResult,
  printArguments,
  walletLoad,
  saveVestingImplAddress,
  saveVestingAddress,
  getDeployedVestingBeaconAddress,
  getDeployedVestingAddress,
  getGameToken,
} = require("./functions");

task(
  "vesting:deploy_impl",
  "deploy vesting implementation contract and upgradeable beacon contract"
)
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Vesting = await ethers.getContractFactory("Vesting", wallet);
    const beacon = await upgrades.deployBeacon(Vesting);
    await beacon.deployed();
    printTxResult(await beacon.deployTransaction.wait());
    console.log(" > used wallet = " + wallet.address);

    console.log(
      " > Vesting implementation contract was deployed to: " +
        (await beacon.implementation())
    );
    console.log(
      " > Vesting beacon contract was deployed to: " + beacon.address
    );
    saveVestingImplAddress(await beacon.implementation(), beacon.address);
  });

task(
  "vesting:deploy",
  "deploy vesting proxy contract with designated beacon address"
)
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addOptionalParam("beacon", "the beacon address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    if (taskArgs.beacon == "") {
      taskArgs.beacon = await getDeployedVestingBeaconAddress();
    }
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Vesting = await ethers.getContractFactory("Vesting", wallet);
    const vesting = await upgrades.deployBeaconProxy(taskArgs.beacon, Vesting);
    await vesting.deployed();
    console.log(" > Vesting proxy deployed to: " + vesting.address);
    saveVestingAddress(vesting);
  });

task("vesting:prepare", "prepare vesting contract")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("beneficiary", "the beneficiary of vesting")
  .addParam("amount", "the vesting amount")
  .addOptionalParam("initial", "the initial unlocked amount", "0")
  .addOptionalParam("vesting", "the vesting contract address", "")
  .addOptionalParam("token", "the target token address", "")
  .addOptionalParam("duration", "the vesting duration(default=36)", "36")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    if (taskArgs.vesting == "") {
      taskArgs.vesting = await getDeployedVestingAddress();
    }
    if (taskArgs.token == "") {
      let token = await getGameToken("");
      taskArgs.token = token.address;
    }
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Vesting = await ethers.getContractFactory("Vesting", wallet);
    const vesting = await Vesting.attach(taskArgs.vesting);
    let tx = await vesting
      .connect(wallet)
      .prepare(
        wallet.address,
        taskArgs.beneficiary,
        taskArgs.amount,
        taskArgs.initial,
        taskArgs.duration,
        taskArgs.token
      );
    printTxResult(await tx.wait());
  });

task("vesting:setstart", "set start timestamp of the vesting contract")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam(
    "start",
    "the start time (yyyy-mm-dd hh:mm:ss), local time zone applied"
  )
  .addOptionalParam("vesting", "the vesting contract address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    if (taskArgs.vesting == "") {
      taskArgs.vesting = await getDeployedVestingAddress();
    }
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Vesting = await ethers.getContractFactory("Vesting", wallet);
    const vesting = await Vesting.attach(taskArgs.vesting);
    let timestamp = Date.parse(taskArgs.start);
    let tx = await vesting.connect(wallet).setStart(timestamp / 1000);
    printTxResult(await tx.wait());
  });

task(
  "vesting:one_stop_setup",
  "deploy vesting proxy contract with designated beacon address and prepare vesting at once"
)
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("beneficiary", "the beneficiary of vesting")
  .addParam("amount", "the vesting amount")
  .addOptionalParam("initial", "the initial unlocked amount", "0")
  .addParam(
    "start",
    "the start time (yyyy-mm-dd hh:mm:ss), local time zone applied"
  )
  .addOptionalParam("beacon", "the beacon address", "")
  .addOptionalParam("token", "the target token address", "")
  .addOptionalParam("duration", "the vesting duration(default=36)", "36")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    if (taskArgs.beacon == "") {
      taskArgs.beacon = await getDeployedVestingBeaconAddress();
    }
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Vesting = await ethers.getContractFactory("Vesting", wallet);
    const vesting = await upgrades.deployBeaconProxy(taskArgs.beacon, Vesting);
    await vesting.deployed();
    console.log(" > Vesting proxy deployed to: " + vesting.address);

    const gameToken = await getGameToken(taskArgs.token, wallet);
    let tx = await gameToken.approve(
      vesting.address,
      BigNumber.from(taskArgs.amount).mul(BigNumber.from(10).pow(18))
    );
    printTxResult(await tx.wait());
    tx = await vesting
      .connect(wallet)
      .prepare(
        wallet.address,
        taskArgs.beneficiary,
        taskArgs.amount,
        taskArgs.initial,
        taskArgs.duration,
        gameToken.address
      );
    printTxResult(await tx.wait());
    let timestamp = Date.parse(taskArgs.start);
    tx = await vesting.connect(wallet).setStart(timestamp / 1000);
    printTxResult(await tx.wait());
    console.log(" > Vesting contract was prepared successfully");
  });

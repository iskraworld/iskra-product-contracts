const { BigNumber } = require("ethers");

const {
  printTxResult,
  printArguments,
  walletLoad,
  saveUtilityTokenAddress,
  getUtilityToken,
} = require("./functions");

task("utilitytoken:deploy", "deploy Iskra UtilityToken contract")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("name", "the token name")
  .addParam("symbol", "the token symbol")
  .addParam("minter", "the first minter")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Token = await ethers.getContractFactory("UtilityToken", wallet);
    const token = await Token.deploy(
      taskArgs.name,
      taskArgs.symbol,
      taskArgs.minter
    );
    await token.deployed();
    printTxResult(await token.deployTransaction.wait());
    console.log(
      " UtilityToken " + taskArgs.name + " was deployed to: " + token.address
    );
    saveUtilityTokenAddress(token);
  });

task("utilitytoken:addminter", "add a minter")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("minter", "a new minter")
  .addOptionalParam("token", "The utility token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getUtilityToken(taskArgs.token, wallet);
    let tx = await token.addMinter(taskArgs.minter);
    printTxResult(await tx.wait());
  });

task("utilitytoken:removeminter", "remove a minter")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("minter", "a new minter")
  .addOptionalParam("token", "The utility token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getUtilityToken(taskArgs.token, wallet);
    let tx = await token.removeMinter(taskArgs.minter);
    printTxResult(await tx.wait());
  });

task("utilitytoken:mint", "Token.mint")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("to", "address to mint to")
  .addParam("amount", "amount to mint")
  .addOptionalParam("token", "The utility token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getUtilityToken(taskArgs.token, wallet);
    let tx = await token.mint(
      taskArgs.to,
      BigNumber.from(taskArgs.amount).mul(BigNumber.from(10).pow(18))
    );
    printTxResult(await tx.wait());
  });

task("utilitytoken:approve", "Token.approve")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("spender", "the spender to approve for")
  .addParam("amount", "the amount to approve")
  .addOptionalParam("token", "The utility token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getUtilityToken(taskArgs.token, wallet);
    let tx = await token.approve(
      taskArgs.spender,
      BigNumber.from(taskArgs.amount).mul(BigNumber.from(10).pow(18))
    );
    printTxResult(await tx.wait());
  });

task("utilitytoken:transfer", "Token.transfer")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("recipient", "the recipient to transfer to")
  .addParam("amount", "the amount to transfer")
  .addOptionalParam("token", "The utility token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getUtilityToken(taskArgs.token, wallet);
    let tx = await token.transfer(
      taskArgs.recipient,
      BigNumber.from(taskArgs.amount).mul(BigNumber.from(10).pow(18))
    );
    printTxResult(await tx.wait());
  });

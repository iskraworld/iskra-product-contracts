const { BigNumber } = require("ethers");

const {
  printTxResult,
  printArguments,
  walletLoad,
  saveGameTokenAddress,
  getGameToken,
} = require("./functions");

task("gametoken:deploy", "deploy Iskra GameToken contract")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("name", "the token name")
  .addParam("symbol", "the token symbol")
  .addParam("supply", "the initial token supply")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Token = await ethers.getContractFactory("GameToken", wallet);
    const token = await Token.deploy(
      taskArgs.name,
      taskArgs.symbol,
      BigNumber.from(taskArgs.supply).mul(BigNumber.from(10).pow(18))
    );
    await token.deployed();
    printTxResult(await token.deployTransaction.wait());
    console.log(
      " Game token " + taskArgs.name + " was deployed to: " + token.address
    );
    saveGameTokenAddress(token);
  });

task("gametoken:approve", "Token.approve")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("spender", "the spender to approve for")
  .addParam("amount", "the amount to approve")
  .addOptionalParam("token", "The game token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getGameToken(taskArgs.token, wallet);
    let tx = await token.approve(
      taskArgs.spender,
      BigNumber.from(taskArgs.amount).mul(BigNumber.from(10).pow(18))
    );
    printTxResult(await tx.wait());
  });

task("gametoken:transfer", "Token.transfer")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("recipient", "the recipient to transfer to")
  .addParam("amount", "the amount to transfer")
  .addOptionalParam("token", "The game token address", "")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await getGameToken(taskArgs.token, wallet);
    let tx = await token.transfer(
      taskArgs.recipient,
      BigNumber.from(taskArgs.amount).mul(BigNumber.from(10).pow(18))
    );
    printTxResult(await tx.wait());
  });

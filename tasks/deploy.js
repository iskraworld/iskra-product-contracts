const { task, types } = require("hardhat/config");
const { printArguments, walletLoad } = require("./functions");

task("deploy", "Deploy a contract from the source.")
  .addPositionalParam("contract", "contract name.")
  .addOptionalVariadicPositionalParam("args", "constructor arguments.", [])
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const factory = await hre.ethers.getContractFactory(taskArgs.contract);
    const contract = await factory
      // @ts-ignore
      .connect(wallet)
      .deploy(...taskArgs.args, {
        nonce: hre.ethers.provider.getTransactionCount(wallet.address),
      });
    await contract.deployed();
    console.log(`contract address: ${contract.address}`);
  });

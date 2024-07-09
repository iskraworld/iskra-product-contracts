const { BigNumber } = require("ethers");
const { printTxResult, printArguments, walletLoad } = require("./functions");
const FTCheckIO = require("../abis-imported/FTCheckIO.json");

task("checkio:checkin", "Check in assets to the syncmodule")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("checkio", "the checkio contract address")
  .addParam("token", "the token address")
  .addParam("bucketId", "the bucket id")
  .addParam("amount", "the amount of token to check in")
  .addOptionalParam("data", "the additional data to check in with", "0x")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const amount = BigNumber.from(taskArgs.amount).mul(
      BigNumber.from(10).pow(18)
    );

    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = await ethers.getContractAt("IERC20", taskArgs.token, wallet);
    let tx = await token.approve(taskArgs.checkio, amount);
    console.log("Approving tokens");
    printTxResult(await tx.wait());

    const checkio = await ethers.getContractAt(
      FTCheckIO,
      taskArgs.checkio,
      wallet
    );
    tx = await checkio["checkIn(address,uint8,address,uint256,bytes)"](
      token.address,
      taskArgs.bucketId,
      wallet.address,
      amount,
      taskArgs.data
    );
    console.log("Check in");
    printTxResult(await tx.wait());
  });

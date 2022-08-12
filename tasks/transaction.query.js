const { printArguments, printQueryResult } = require("./functions");

task("getTransaction", "query transaction by the hash of it")
  .addParam("hash", "transaction hash")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    printQueryResult(await ethers.provider.getTransaction(taskArgs.hash));
  });

task("getTransactionReceipt", "query transaction receipt by the hash of it")
  .addParam("hash", "transaction hash")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    printQueryResult(
      await ethers.provider.getTransactionReceipt(taskArgs.hash)
    );
  });

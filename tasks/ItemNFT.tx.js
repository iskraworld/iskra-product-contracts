const {
  getItemNFT,
  printTxResult,
  printArguments,
  saveItemNFTAddress,
  walletLoad,
} = require("./functions");
const config = require("hardhat/config");

task("itemnft:deploy", "deploy Iskra ItemNFT contract")
  .addParam("name", "name")
  .addParam("symbol", "symbol")
  .addOptionalParam("uri", "baseuri", "")
  .addFlag("burnable", "burnable", false)
  .addFlag("snapshot", "snapshot", false)
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    let factory;
    if (taskArgs.snapshot) {
      factory = await ethers.getContractFactory("ItemNFTSnapshot");
    } else {
      factory = await ethers.getContractFactory("ItemNFT");
    }
    const token = await factory
      .connect(wallet)
      .deploy(taskArgs.name, taskArgs.symbol, taskArgs.uri, taskArgs.burnable);
    await token.deployed();
    printTxResult(await token.deployTransaction.wait());
    saveItemNFTAddress(token);
  });

task("itemnft:safetransferfrom", "transfer a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("from", "Token is transferred from")
  .addParam("to", "Token is transferred to")
  .addParam("id", "The token id")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.safeTransferFrom(
      taskArgs.from,
      taskArgs.to,
      taskArgs.id
    );
    printTxResult(await tx.wait());
  });

task("itemnft:mint", "mint a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("to", "The target address receiving minted token")
  .addParam("id", "The token id")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.safeMint(taskArgs.to, taskArgs.id);
    printTxResult(await tx.wait());
  });

task("itemnft:mint-batch", "mint tokens")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("to", "The target address receiving minted token")
  .addOptionalParam("ids", "Comma seperated token ids")
  .addOptionalParam("range", "start-end formatted range")
  .addOptionalParam("batchSize", "num tokens in a TX", 300, config.types.int)
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);

    let ids;
    if (taskArgs.ids) {
      if (taskArgs.range) {
        console.error("cannot specify both of ids and range");
        return;
      }
      ids = taskArgs.ids.split(",");
    } else if (taskArgs.range) {
      const range = taskArgs.range.split("-");
      ids = [];
      for (let i = BigInt(range[0]); i <= BigInt(range[1]); i++) {
        ids.push(i);
      }
    } else {
      console.error("Neither ids nor range are specified");
      return;
    }
    if (ids.length == 0) {
      console.error("empty token ids");
      return;
    }

    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    let idx = 0;
    do {
      const idsSlice = ids.slice(idx, idx + taskArgs.batchSize);
      console.log(
        `- from: ${idsSlice[0]}, to: ${idsSlice[idsSlice.length - 1]}`
      );
      const tx = await token.safeMintBatch(taskArgs.to, idsSlice);
      const receipt = await tx.wait();
      console.log(`  tx: ${receipt.transactionHash}`);
      idx += idsSlice.length;
    } while (idx <= ids.length - 1);
  });

task("itemnft:burn", "burn a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("id", "The token id")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.burn(taskArgs.id);
    printTxResult(await tx.wait());
  });

task("itemnft:seturi", "set URI")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("id", "The token id")
  .addParam("uri", "uri string")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.setTokenURI(taskArgs.id, taskArgs.uri);
    printTxResult(await tx.wait());
  });

task("itemnft:setbaseuri", "set Base URI")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("uri", "uri string")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.setBaseURI(taskArgs.uri);
    printTxResult(await tx.wait());
  });

task("itemnft:setapprovalforall", "set approval for a account/operator pair")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam(
    "operator",
    "operator to be granted or revoked to transfer the caller's tokens"
  )
  .addParam("approved", "true/false: approve or not")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.setApprovalForAll(
      taskArgs.operator,
      JSON.parse(taskArgs.approved)
    );
    printTxResult(await tx.wait());
  });

task("itemnft:setburnpermission", "set burn permission to the account")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra ItemNFT contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("account", "account")
  .addParam("approved", "true/false: approve or not")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.setBurnPermissionApproval(
      taskArgs.account,
      JSON.parse(taskArgs.approved)
    );
    printTxResult(await tx.wait());
  });

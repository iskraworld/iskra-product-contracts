const {
  getItemNFT,
  printTxResult,
  printArguments,
  saveItemNFTAddress,
  walletLoad,
} = require("./functions");

task("itemnft:deploy", "deploy Iskra ItemNFT contract")
  .addParam("name", "name")
  .addParam("symbol", "symbol")
  .addOptionalParam("uri", "baseuri", "")
  .addFlag("burnable", "burnable", false)
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Token = await ethers.getContractFactory("ItemNFT");
    const token = await Token.connect(wallet).deploy(
      taskArgs.name,
      taskArgs.symbol,
      taskArgs.uri,
      taskArgs.burnable
    );
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
    const tx = await token.mint(taskArgs.to, taskArgs.id);
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
  .addParam("ids", "Comma seperated token ids")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getItemNFT(taskArgs.contract)).connect(wallet);
    const tx = await token.mintBatch(taskArgs.to, taskArgs.ids.split(","));
    printTxResult(await tx.wait());
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

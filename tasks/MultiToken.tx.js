const {
  getMultiToken,
  printTxResult,
  printArguments,
  saveMultiTokenAddress,
  walletLoad,
} = require("./functions");

task("multitoken:deploy", "deploy Iskra MultiToken contract")
  .addParam("name", "collection name")
  .addFlag("pausable", "whether the token is pausable")
  .addFlag("burnable", "whether the token is burnable")
  .addOptionalParam("uri", "baseuri", "")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const Token = await ethers.getContractFactory("MultiToken");
    const token = await Token.connect(wallet).deploy(
      taskArgs.uri,
      taskArgs.name,
      taskArgs.pausable,
      taskArgs.burnable
    );
    await token.deployed();
    printTxResult(await token.deployTransaction.wait());
    saveMultiTokenAddress(token);
  });

task("multitoken:safetransferfrom", "transfer a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
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
  .addParam("amount", "The amount of token")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    const tx = await token.safeTransferFrom(
      taskArgs.from,
      taskArgs.to,
      taskArgs.id,
      taskArgs.amount,
      "0x"
    );
    printTxResult(await tx.wait());
  });

task("multitoken:safetransferfrom-batch", "transfer tokens")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("from", "Token is transferred from")
  .addParam("to", "Token is transferred to")
  .addParam("ids", "Comma seperated token ids")
  .addParam("amounts", "Comma seperated amounts")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    const tx = await token.safeBatchTransferFrom(
      taskArgs.from,
      taskArgs.to,
      taskArgs.ids.split(","),
      taskArgs.amounts.split(","),
      "0x"
    );
    printTxResult(await tx.wait());
  });
task("multitoken:mint", "mint a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("to", "The target address receiving minted token")
  .addParam("id", "The token id")
  .addParam("amount", "The amount of token")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    const supply = await token.totalSupply(taskArgs.id);
    if (supply.eq(1)) {
      console.error(
        `token id [${taskArgs.id}] is treated as non-fungible and cannot be minted more than 1`
      );
      return;
    }
    const tx = await token.mint(
      taskArgs.to,
      taskArgs.id,
      taskArgs.amount,
      "0x"
    );
    printTxResult(await tx.wait());
  });
task("multitoken:mint-batch", "mint tokens")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("to", "The target address receiving minted token")
  .addParam("ids", "Comma seperated token ids")
  .addParam("amounts", "Comma seperated amounts")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    for (let id in taskArgs.ids.split(",")) {
      let supply = await token.totalSupply(id);
      if (supply.eq(1)) {
        console.error(
          `token id [${id}] is treated as non-fungible and cannot be minted more than 1`
        );
        return;
      }
    }
    const tx = await token.mintBatch(
      taskArgs.to,
      taskArgs.ids.split(","),
      taskArgs.amounts.split(","),
      "0x"
    );
    printTxResult(await tx.wait());
  });
task("multitoken:burn", "burn a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("from", "Token is burned from")
  .addParam("id", "The token id")
  .addParam("amount", "The amount of token")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    const supply = await token.totalSupply(taskArgs.id);
    if (supply.sub(taskArgs.amount).eq(1)) {
      console.error(
        `token id [${taskArgs.id}] is treated as fungible and hence cannot be burned to total supply 1`
      );
      return;
    }
    const tx = await token.burn(taskArgs.from, taskArgs.id, taskArgs.amount);
    printTxResult(await tx.wait());
  });
task("multitoken:burn-batch", "burn tokens")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("from", "Token is burned from")
  .addParam("ids", "Comma seperated token ids")
  .addParam("amounts", "Comma seperated amounts")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    for (let [index, id] of taskArgs.ids.split(",").entries()) {
      let supply = await token.totalSupply(id);
      if (supply.sub(taskArgs.amounts.split(",")[index]).eq(1)) {
        console.error(
          `token id [${id}] is treated as fungible and hence cannot be burned to total supply 1`
        );
        return;
      }
    }
    const tx = await token.burnBatch(
      taskArgs.from,
      taskArgs.ids.split(","),
      taskArgs.amounts.split(",")
    );
    printTxResult(await tx.wait());
  });

task("multitoken:seturi", "set URI")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
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
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    const tx = await token.setURI(taskArgs.id, taskArgs.uri);
    printTxResult(await tx.wait());
  });

task("multitoken:setapprovalforall", "set approval for a account/operator pair")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
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
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    const tx = await token.setApprovalForAll(
      taskArgs.operator,
      JSON.parse(taskArgs.approved)
    );
    printTxResult(await tx.wait());
  });

task("multitoken:grantrole", "grant a role to the account")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("account", "account")
  .addParam(
    "role",
    "DEFAULT_ADMIN_ROLE, URI_SETTER_ROLE, MINTER_ROLE, PAUSER_ROLE"
  )
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    let hashedRole = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(taskArgs.role)
    );
    if (taskArgs.role === "DEFAULT_ADMIN_ROLE") {
      hashedRole = ethers.utils.formatBytes32String("");
    }
    const tx = await token.grantRole(hashedRole, taskArgs.account);
    printTxResult(await tx.wait());
  });

task("multitoken:revokerole", "grant a role to the account")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("account", "account")
  .addParam(
    "role",
    "DEFAULT_ADMIN_ROLE, URI_SETTER_ROLE, MINTER_ROLE, PAUSER_ROLE"
  )
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const token = (await getMultiToken(taskArgs.contract)).connect(wallet);
    let hashedRole = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(taskArgs.role)
    );
    if (taskArgs.role === "DEFAULT_ADMIN_ROLE") {
      hashedRole = ethers.utils.formatBytes32String("");
    }
    const tx = await token.revokeRole(hashedRole, taskArgs.account);
    printTxResult(await tx.wait());
  });

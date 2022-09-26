const {
  getMultiToken,
  printArguments,
  printQueryResult,
} = require("./functions");

task("multitoken:balanceof", "query balance of account for the token id")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("address", "The address querying balance")
  .addParam("id", "The token id")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    printQueryResult(await token.balanceOf(taskArgs.address, taskArgs.id));
  });

task("multitoken:balanceof-batch", "query balances of account for the token id")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("addresses", "addresses querying balance")
  .addParam("ids", "token ids")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    printQueryResult(
      await token.balanceOfBatch(
        taskArgs.addresses.split(","),
        taskArgs.ids.split(",")
      )
    );
  });

task("multitoken:uri", "query URI")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("id", "The token id")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    printQueryResult(await token.uri(taskArgs.id));
  });

task("multitoken:totalsupply", "query total supply of a token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("id", "The token id")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    printQueryResult(await token.totalSupply(taskArgs.id));
  });

task("multitoken:exist", "query existence of the token")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("id", "The token id")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    printQueryResult(await token.exists(taskArgs.id));
  });

task(
  "multitoken:isapprovalforall",
  "query approval for a account/operator pair"
)
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("account", "account grants permission to operator")
  .addParam("operator", "operator granted to transfer the caller's tokens")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    printQueryResult(
      await token.isApprovedForAll(taskArgs.account, taskArgs.operator)
    );
  });

task("multitoken:hasrole", "query an account has the role")
  .addOptionalParam(
    "contract",
    "The address of deployed Iskra MultiToken contract",
    ""
  )
  .addParam("account", "account has the role")
  .addParam(
    "role",
    "DEFAULT_ADMIN_ROLE, URI_SETTER_ROLE, MINTER_ROLE, PAUSER_ROLE"
  )
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    const token = await getMultiToken(taskArgs.contract);
    let hashedRole = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(taskArgs.role)
    );
    if (taskArgs.role === "DEFAULT_ADMIN_ROLE") {
      hashedRole = ethers.utils.formatBytes32String("");
    }
    printQueryResult(await token.hasRole(hashedRole, taskArgs.account));
  });

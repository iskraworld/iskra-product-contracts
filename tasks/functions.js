const process = require("process");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { BigNumber } = require("ethers");

const multiTokenHomeDir = path.join(os.homedir(), ".iskra-console");
const deployedContractDir = path.join(multiTokenHomeDir, "deployed");
const multiTokenAddressJson = path.join(
  deployedContractDir,
  "multitoken-address.json"
);
const gameTokenAddressJson = path.join(
  deployedContractDir,
  "gametoken-address.json"
);
const utilityTokenAddressJson = path.join(
  deployedContractDir,
  "utilitytoken-address.json"
);
const itemNFTAddressJson = path.join(
    deployedContractDir,
    "itemnft-address.json"
);
const vestingImplAddressJson = path.join(
  deployedContractDir,
  "vesting-impl-address.json"
);
const vestingAddressJson = path.join(
  deployedContractDir,
  "vesting-address.json"
);

const walletDir = path.join(multiTokenHomeDir, "wallet");

async function getMultiToken(address) {
  if (address.length === 0) {
    const fs = require("fs");

    if (!fs.existsSync(multiTokenAddressJson)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(multiTokenAddressJson);
    address = JSON.parse(addressJson).MultiTokenAddress;
  }

  if ((await ethers.provider.getCode(address)) === "0x") {
    console.error("FAILED: You need to deploy your contract first");
    process.exit(1);
  }

  return await ethers.getContractAt("MultiToken", address);
}

async function getGameToken(address, wallet) {
  if (address.length === 0) {
    const fs = require("fs");

    if (!fs.existsSync(gameTokenAddressJson)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(gameTokenAddressJson);
    address = JSON.parse(addressJson).GameTokenAddress;
  }

  if ((await ethers.provider.getCode(address)) === "0x") {
    console.error("FAILED: You need to deploy your contract first");
    process.exit(1);
  }

  return await ethers.getContractAt("GameToken", address, wallet);
}

async function getUtilityToken(address, wallet) {
  if (address.length === 0) {
    const fs = require("fs");

    if (!fs.existsSync(utilityTokenAddressJson)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(utilityTokenAddressJson);
    address = JSON.parse(addressJson).UtilityTokenAddress;
  }

  if ((await ethers.provider.getCode(address)) === "0x") {
    console.error("FAILED: You need to deploy your contract first");
    process.exit(1);
  }

  return await ethers.getContractAt("UtilityToken", address, wallet);
}

async function getItemToken(address, wallet) {
  if (address.length === 0) {
    const fs = require("fs");

    if (!fs.existsSync(itemTokenAddressJson)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(itemTokenAddressJson);
    address = JSON.parse(addressJson).ItemTokenAddress;
  }

  if ((await ethers.provider.getCode(address)) === "0x") {
    console.error("FAILED: You need to deploy your contract first");
    process.exit(1);
  }

  return await ethers.getContractAt("ItemToken", address, wallet);
}

async function getDeployedVestingBeaconAddress() {
  if (!fs.existsSync(vestingImplAddressJson)) {
    console.error(
      "You need to deploy your vesting implementation contract first"
    );
    return;
  }

  const addressJson = fs.readFileSync(vestingImplAddressJson);
  return JSON.parse(addressJson).VestingBeaconAddress;
}

async function getDeployedVestingAddress() {
  if (!fs.existsSync(vestingAddressJson)) {
    console.error("You need to deploy your vesting proxy contract first");
    return;
  }

  const addressJson = fs.readFileSync(vestingAddressJson);
  return JSON.parse(addressJson).VestingAddress;
}

function printArguments(taskArgs) {
  console.log("============Args================");
  console.log(taskArgs);
  console.log("================================");
}

function printTxResult(receipt) {
  console.log("============TxResult============");
  if (receipt.status !== 1) {
    console.error("Tx Failed");
    console.error(receipt.logs);
  } else {
    console.log("Tx Success");
    console.log(receipt.logs);
  }
  console.log("================================");
}

function printQueryResult(queried) {
  console.log("============QueryResult=========");
  console.log(queried);
  console.log("================================");
}

function saveMultiTokenAddress(token) {
  const fs = require("fs");
  checkDeployDir(fs);

  fs.writeFileSync(
    multiTokenAddressJson,
    JSON.stringify({ MultiTokenAddress: token.address }, undefined, 2)
  );
}

function saveGameTokenAddress(token) {
  const fs = require("fs");
  checkDeployDir(fs);

  fs.writeFileSync(
    gameTokenAddressJson,
    JSON.stringify({ GameTokenAddress: token.address }, undefined, 2)
  );
}

function saveUtilityTokenAddress(token) {
  const fs = require("fs");
  checkDeployDir(fs);

  fs.writeFileSync(
    utilityTokenAddressJson,
    JSON.stringify({ UtilityTokenAddress: token.address }, undefined, 2)
  );
}

function saveItemNFTAddress(token) {
  const fs = require("fs");
  checkDeployDir(fs);

  fs.writeFileSync(
      itemNFTAddressJson,
      JSON.stringify({ ItemNFTAddress: token.address }, undefined, 2)
  );
}

function saveVestingImplAddress(impl, beacon) {
  const fs = require("fs");
  checkDeployDir(fs);

  fs.writeFileSync(
    vestingImplAddressJson,
    JSON.stringify(
      {
        VestingImplAddress: impl,
        VestingBeaconAddress: beacon,
      },
      undefined,
      2
    )
  );
}

function saveVestingAddress(vesting) {
  const fs = require("fs");
  checkDeployDir(fs);

  fs.writeFileSync(
    vestingAddressJson,
    JSON.stringify({ VestingAddress: vesting.address }, undefined, 2)
  );
}

function checkDeployDir(fs) {
  if (!fs.existsSync(deployedContractDir)) {
    fs.mkdirSync(deployedContractDir, { recursive: true });
  }
}

function walletExist(name) {
  const walletJson = path.join(walletDir, name);
  return fs.existsSync(walletJson);
}

function walletList() {
  return fs.readdirSync(walletDir);
}

async function defaultWallet() {
  let accounts = await ethers.getSigners();
  return accounts[0];
}

async function walletLoad(name, password) {
  if (name == undefined) {
    return defaultWallet();
  }
  const walletJson = path.join(walletDir, name);
  if (!fs.existsSync(walletJson)) {
    console.error(`wallet [${name}] is not exist`);
    return;
  }
  const walletJsonContent = fs.readFileSync(walletJson);

  return ethers.Wallet.fromEncryptedJsonSync(
    walletJsonContent,
    password
  ).connect(ethers.provider);
}

function walletShow(name) {
  const walletJson = path.join(walletDir, name);
  if (!fs.existsSync(walletJson)) {
    console.error(`wallet [${name}] is not exist`);
    return;
  }
  return fs.readFileSync(walletJson, "utf-8");
}

async function walletSave(name, password, wallet) {
  const encrypted = await wallet.encrypt(password);
  const walletJson = path.join(walletDir, name);
  let success = false;
  try {
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }
    fs.writeFileSync(walletJson, encrypted);
    success = true;
  } catch (err) {
    console.error(err);
  }
  return success;
}

async function walletDelete(name) {
  const walletJson = path.join(walletDir, name);
  let success = false;
  try {
    fs.unlinkSync(walletJson);
    success = true;
  } catch (err) {
    console.error(err);
  }
  return success;
}

function toTokenAmount(amount) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

async function sendBaseCoinTo(to, amount) {
  const [owner] = await ethers.getSigners();
  await owner.sendTransaction({
    to: to,
    value: toTokenAmount(amount),
  });
}

module.exports = {
  getMultiToken,
  getGameToken,
  getUtilityToken,
  getDeployedVestingBeaconAddress,
  getDeployedVestingAddress,
  printArguments,
  printTxResult,
  printQueryResult,
  saveMultiTokenAddress,
  saveGameTokenAddress,
  saveUtilityTokenAddress,
  saveItemNFTAddress,
  saveVestingImplAddress,
  saveVestingAddress,
  walletExist,
  walletLoad,
  walletSave,
  walletDelete,
  walletList,
  walletShow,
  sendBaseCoinTo,
};

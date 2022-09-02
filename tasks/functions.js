const process = require("process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const multiTokenHomeDir = path.join(os.homedir(), ".iskra-multitoken");
const deployedContractDir = path.join(multiTokenHomeDir, "deployed");
const contractAddressJson = path.join(
  deployedContractDir,
  "contract-address.json"
);

const walletDir = path.join(multiTokenHomeDir, "wallet");

async function getToken(address) {
  if (address.length === 0) {
    const fs = require("fs");

    if (!fs.existsSync(contractAddressJson)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(contractAddressJson);
    address = JSON.parse(addressJson).MultiTokenAddress;
  }

  if ((await ethers.provider.getCode(address)) === "0x") {
    console.error("FAILED: You need to deploy your contract first");
    process.exit(1);
  }

  return await ethers.getContractAt("MultiToken", address);
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

function saveTokenAddress(token) {
  const fs = require("fs");

  if (!fs.existsSync(deployedContractDir)) {
    fs.mkdirSync(deployedContractDir, { recursive: true });
  }

  fs.writeFileSync(
    contractAddressJson,
    JSON.stringify({ MultiTokenAddress: token.address }, undefined, 2)
  );
}

function walletExist(name) {
  const walletJson = path.join(walletDir, name);
  return fs.existsSync(walletJson);
}

function walletList() {
  return fs.readdirSync(walletDir);
}

function walletLoad(name, password) {
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

module.exports = {
  getToken,
  printArguments,
  printTxResult,
  printQueryResult,
  saveTokenAddress,
  walletExist,
  walletLoad,
  walletSave,
  walletDelete,
  walletList,
  walletShow,
};

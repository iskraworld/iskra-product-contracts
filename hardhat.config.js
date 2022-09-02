require("@nomiclabs/hardhat-truffle5");
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('hardhat-abi-exporter');
require("./tasks/transaction.query");
require("./tasks/wallet");
require("./tasks/MultiToken.tx");
require("./tasks/MultiToken.query");
require("hardhat-gas-reporter");


const deployedMultiTokenAddress = "./iskra-multitoken";

const { removeConsoleLog } = require("hardhat-preprocessor");
module.exports = {
  preprocess: {
    eachLine: removeConsoleLog((hre) => {
      return (
        !hre.network.name.includes("hardhat") &&
        !hre.network.name.includes("local") &&
        !hre.network.name.includes("test")
      );
    })
  },
  solidity: {
    version: "0.8.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      },
      evmVersion: "constantinople"
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    baobab: {
      url: "https://api.baobab.klaytn.net:8651",
      networkId: 1001,
      accounts: {
        mnemonic: "donkey tunnel music romance other cluster magic custom author deputy swap impulse"
      }
    },
    // FPyM6j5Mxrxgf0Tvx17010_nbLMBezv_
    // https://eth-goerli.g.alchemy.com/v2/FPyM6j5Mxrxgf0Tvx17010_nbLMBezv_
    // wss://eth-goerli.g.alchemy.com/v2/FPyM6j5Mxrxgf0Tvx17010_nbLMBezv_
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/FPyM6j5Mxrxgf0Tvx17010_nbLMBezv_",
      networkId: 0x5,
      accounts: {
        mnemonic: "donkey tunnel music romance other cluster magic custom author deputy swap impulse"
      }
    },
    amethyst: {
      url: "https://chain.iskra.cloud/baomon",
      networkId: 20221,
      accounts: {
        mnemonic: "donkey tunnel music romance other cluster magic custom author deputy swap impulse"
      },
      gasPrice: 0,
      httpHeaders: {
        Authorization: 'Basic aXNrcmEtZGV2OkRNREQxRWdCcUhDM2dTSVRjSnFx'
      }
    }
  },
  gasReporter: {
    enabled: true
  },
  abiExporter: {
    path: "abis",
    clear: true,
    flat: true,
    only: ["MultiToken"],
    except: ["mock"],
    spacing: 2,
    pretty: false
  }
};

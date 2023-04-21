require("@nomiclabs/hardhat-truffle5");
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('hardhat-abi-exporter');
require("./tasks/transaction.query");
require("./tasks/wallet");
require("./tasks/MultiToken.tx");
require("./tasks/MultiToken.query");
require("./tasks/GameToken.tx");
require("./tasks/Vesting.tx");
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
    version: "0.8.7",
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
      allowUnlimitedContractSize: true,
      accounts: { // address: 14pd7rmhaCs9bawxis5XZ9bLhUWJs9o3ru
        mnemonic: "crater kiwi depth alley myth flag bleak swing fragile abandon pupil twist"
      }
    },
    baobab: {
      url: "https://api.baobab.klaytn.net:8651",
      networkId: 1001,
      accounts: {
        mnemonic: "crater kiwi depth alley myth flag bleak swing fragile abandon pupil twist"
      }
    },
    goerli: {
      url: "https://rpc.goerli.mudit.blog/",
      networkId: 0x5,
      accounts: {
        mnemonic: "crater kiwi depth alley myth flag bleak swing fragile abandon pupil twist"
      }
    },
    cypress: {
      url: "https://public-node-api.klaytnapi.com/v1/cypress",
      networkId: 8217
    },
    ethereum: {
      url: "https://mainnet.infura.io/v3/",
      networkId: 1
    }
  },
  gasReporter: {
    enabled: true
  },
  abiExporter: {
    path: "abis",
    clear: true,
    flat: true,
    only: ["GameToken","GovernanceToken", "UtilityToken", "MultiToken","Vesting"],
    except: ["mock"],
    spacing: 2,
    pretty: false
  }
};

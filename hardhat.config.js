require("@nomiclabs/hardhat-truffle5");
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('hardhat-abi-exporter');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      chainId: 1337 // We set 1337 to make interacting with MetaMask simpler
    }
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

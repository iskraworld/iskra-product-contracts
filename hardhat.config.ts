import "dotenv/config";
import yargs from "yargs/yargs";

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import { extendEnvironment } from "hardhat/config";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { HardhatUserConfig } from "hardhat/types/config";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";

import { ConfigurableGasPriceProvider } from "./scripts/util/configurable-gas-price-provider";
import { FeeDataFetcher } from "./scripts/util/fee-data-fetcher";
import { createProviderProxy } from "./scripts/util/provider-proxy";
import "./scripts/util/type-extensions";
import "./tasks/common/call";
import "./tasks/common/deploy";
import "./tasks/common/signer";
import "./tasks/common/transaction";
import "./tasks/common/wallet";

const argv = yargs()
    .env("")
    .options({
        ethereumRpc: {
            type: "string",
            default: "https://eth-mainnet.public.blastapi.io",
        },
        sepoliaRpc: {
            type: "string",
            default: "https://eth-sepolia.public.blastapi.io",
        },
        cypressRpc: {
            type: "string",
            default: "https://public-en-cypress.klaytn.net",
        },
        baobabRpc: {
            type: "string",
            default: "https://api.baobab.klaytn.net:8651",
        },
        baseRpc: {
            type: "string",
            default: "https://mainnet.base.org",
        },
        baseSepoliaRpc: {
            type: "string",
            default: "https://sepolia.base.org",
        },
        mnemonic: {
            type: "string",
            // m/44'/60'/0'/0/0: 0x3e947aE0A245AcD51A1e1021fE8B50c22D215758
            default:
                "crater kiwi depth alley myth flag bleak swing fragile abandon pupil twist",
        },
    })
    .parseSync();

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    const gasPrice = hre.network.config.gasPrice;
    const maxFeePerGas = hre.network.config.maxFeePerGas;
    const maxPriorityFeePerGas = hre.network.config.maxPriorityFeePerGas;

    const feeDataFetcher = new FeeDataFetcher(hre.network.provider, {
        gasPrice:
            gasPrice === "auto" || gasPrice === undefined
                ? null
                : BigInt(gasPrice),
        maxFeePerGas: maxFeePerGas === undefined ? null : BigInt(maxFeePerGas),
        maxPriorityFeePerGas:
            maxPriorityFeePerGas === undefined
                ? null
                : BigInt(maxPriorityFeePerGas),
    });
    const configurableGasPriceProvider = new ConfigurableGasPriceProvider(
        hre.network.provider,
        feeDataFetcher
    );
    hre.network.provider = new BackwardsCompatibilityProviderAdapter(
        configurableGasPriceProvider
    );
    hre.ethers.provider = createProviderProxy(
        hre.network.provider,
        feeDataFetcher
    );
});

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.22",
        settings: {
            optimizer: {
                enabled: true,
            },
            evmVersion: "istanbul",
        },
    },
    networks: {
        hardhat: {
            accounts: {
                mnemonic: argv.mnemonic,
            },
        },
        ethereum: {
            url: argv.ethereumRpc,
            chainId: 1,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
            maxPriorityFeePerGas: 1000,
        },
        sepolia: {
            url: argv.sepoliaRpc,
            chainId: 11155111,
            accounts: {
                mnemonic: argv.mnemonic,
            },
            maxPriorityFeePerGas: 1000,
        },
        cypress: {
            url: argv.cypressRpc,
            chainId: 8217,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        baobab: {
            url: argv.baobabRpc,
            chainId: 1001,
            accounts: {
                mnemonic: argv.mnemonic,
            },
        },
        base: {
            url: argv.baseRpc,
            chainId: 8453,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
            maxPriorityFeePerGas: 1000,
        },
        baseSepolia: {
            url: argv.baseSepoliaRpc,
            chainId: 84532,
            accounts: {
                mnemonic: argv.mnemonic,
            },
            maxPriorityFeePerGas: 1000,
        },
    },
    abiExporter: {
        path: "abis",
        clear: true,
        flat: true,
        only: ["GameToken","GovernanceToken", "UtilityToken", "MultiToken","Vesting","ItemNFT","ItemNFTSnapshot"],
        except: ["mock"],
        spacing: 2,
        pretty: false,
    },
    gasReporter: {
        enabled: true,
    },
};

export default config;

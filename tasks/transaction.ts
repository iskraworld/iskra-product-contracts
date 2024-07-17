import { task } from "hardhat/config";
import { bigintToString } from "./util";

task("getTransaction", "query transaction by the hash of it")
    .addPositionalParam("hash", "transaction hash")
    .setAction(async (taskArgs, hre) => {
        console.log(`=== INPUT ===`);
        console.log(`hash: ${taskArgs.hash}`);
        console.log(`=============\n`);

        const result = await hre.ethers.provider.getTransaction(taskArgs.hash);

        console.log(
            JSON.stringify(
                result,
                (key, value) =>
                    value?.hex ? bigintToString(BigInt(value.hex)) : value,
                2
            )
        );
    });

task("getTransactionReceipt", "query transaction receipt by the hash of it")
    .addParam("hash", "transaction hash")
    .setAction(async (taskArgs, hre) => {
        const result = await hre.ethers.provider.getTransactionReceipt(
            taskArgs.hash
        );
        console.log(
            JSON.stringify(
                {
                    transactionHash: result.transactionHash,
                    blockNumber: result.blockNumber,
                    blockHash: result.blockHash,
                    transactionIndex: result.transactionIndex,
                    from: result.from,
                    to: result.to,
                    gasUsed: result.gasUsed,
                    cumulativeGasUsed: result.cumulativeGasUsed,
                    effectiveGasPrice: result.effectiveGasPrice,
                    status: result.status,
                },
                (key, value) =>
                    value?.hex ? bigintToString(BigInt(value.hex)) : value,
                2
            )
        );
    });

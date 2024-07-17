import { FunctionFragment, Interface } from "@ethersproject/abi";
import "@nomiclabs/hardhat-ethers";
import appRoot from "app-root-path";
import { Contract, Signer } from "ethers";
import fs from "fs";
import { subtask, task, types } from "hardhat/config";
import path from "path";

import { bigintToString, parseCallArgs, printResult } from "./util";

subtask("call-internal")
    .addParam("address", "contract address", undefined, types.string, false)
    .addOptionalParam(
        "functionFragment",
        "function fragment",
        undefined,
        types.any
    )
    .addOptionalParam("args", "arguments", [], {
        name: "array",
        validate: (_argName: string, _argumentValue: any) =>
            Array.isArray(_argumentValue),
    })
    .addOptionalParam("block", "block height", undefined, types.int)
    .addOptionalParam("signer", "signer", undefined, types.any)
    .addFlag("estimateGas", "estimate gas")
    .setAction(async (taskArgs, hre) => {
        const functionFragment = taskArgs.functionFragment;
        const iface = new Interface([functionFragment]);
        const [signer] = await hre.ethers.getSigners();
        const contract = new Contract(
            taskArgs.address,
            iface,
            taskArgs.signer ?? signer
        );

        let ret;
        if (taskArgs.estimateGas) {
            ret = await contract.estimateGas[functionFragment.name](
                ...taskArgs.args
            );
        } else {
            if (functionFragment.constant) {
                if (taskArgs.block) {
                    ret = await contract[functionFragment.name](
                        ...taskArgs.args,
                        {
                            blockTag: taskArgs.block,
                        }
                    );
                } else {
                    ret = await contract[functionFragment.name](
                        ...taskArgs.args
                    );
                }
            } else {
                ret = await contract[functionFragment.name](...taskArgs.args);
                if (ret.wait) {
                    ret = await ret.wait();
                }
            }
        }
        return ret;
    });

task("call", "Call a function of contract")
    .addPositionalParam("address", "contract address")
    .addPositionalParam("contract", "contract name")
    .addPositionalParam("function", "function name")
    .addOptionalVariadicPositionalParam("args", "arguments", [])
    .addFlag("estimateGas", "estimate gas")
    .addOptionalParam("block", "block height", undefined, types.int)
    .addOptionalParam("chunking", "chunking field names")
    .addOptionalParam("chunkingLimit", "chunking size", 200, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam(
        "wallet",
        "The wallet name to sign this transaction. wallet:add first"
    )
    .addOptionalParam("password", "password for decrypting wallet")
    .addOptionalParam("privateKey", "private key")
    .addOptionalParam(
        "jsonKeyfile",
        "json key file to sign tx.",
        undefined,
        types.inputFile
    )
    .addOptionalParam("ledger", "address of ledger for sign")
    .setAction(async (taskArgs, hre) => {
        const signer: Signer = await hre.run("signer", taskArgs);

        console.log(`=== INPUT ===`);
        console.log(`signer: ${await signer.getAddress()}`);
        console.log(`address: ${taskArgs.address}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`function: ${taskArgs.function}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`estimateGas: ${taskArgs.estimateGas}`);
        console.log(`block: ${taskArgs.block}`);
        console.log(`chunking: ${taskArgs.chunking}`);
        console.log(`chunkingLimit: ${taskArgs.chunkingLimit}`);
        console.log(`=============\n`);

        let iface;
        const abiRoot = path.join(appRoot.path, "abis-imported");
        for (const abi of fs.readdirSync(abiRoot)) {
            const dot = abi.lastIndexOf(".");
            let abiName = abi.slice(0, dot);
            if (abiName === taskArgs.contract) {
                iface = new Interface(
                    fs.readFileSync(
                        path.join(appRoot.path, "abis-imported", abi),
                        "utf8"
                    )
                );
                break;
            }
        }
        if (!iface) {
            const artifact = await hre.artifacts.readArtifact(
                taskArgs.contract
            );
            iface = new Interface(artifact.abi);
        }
        const functionFragment = iface.getFunction(taskArgs.function);
        const args = parseCallArgs(taskArgs.args, functionFragment);

        console.log("parsed args:", args);

        const chunking = [];
        if (taskArgs.chunking) {
            for (const chunkingField of taskArgs.chunking.split(",")) {
                let chunkingIndex = functionFragment.inputs.findIndex(
                    (input) => input.name === chunkingField
                );
                if (chunkingIndex == -1) {
                    if (Number(chunkingField)) {
                        chunkingIndex = Number(chunkingField);
                    } else {
                        throw new Error(
                            `cannot find chunking field ${chunkingField}`
                        );
                    }
                }
                chunking.push(chunkingIndex);
            }
        }

        let start = 0;
        let result;
        do {
            const chunkArgs = [...args];
            for (const i of chunking) {
                chunkArgs[i] = args[i].slice(
                    start,
                    start + taskArgs.chunkingLimit
                );
            }

            result = await hre.run("call-internal", {
                address: taskArgs.address,
                functionFragment: functionFragment,
                args: chunkArgs,
                block: taskArgs.block,
                signer: signer,
                estimateGas: taskArgs.estimateGas,
            });

            if (result["transactionHash"]) {
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
                            value.hex
                                ? bigintToString(BigInt(value.hex))
                                : value,
                        2
                    )
                );
            } else {
                printResult("", result, 0);
            }
            start += chunking.length > 0 ? chunkArgs[chunking[0]].length : 0;
        } while (chunking.length > 0 && start < args[chunking[0]].length);

        return chunking.length == 0 ? result : undefined;
    });

task("call-sig", "Call a function of contract without abi")
    .addPositionalParam("address", "contract address")
    .addPositionalParam("functionSig", "function signature")
    .addOptionalVariadicPositionalParam("args", "arguments", [])
    .addFlag("estimateGas", "estimate gas")
    .addOptionalParam("block", "block height", undefined, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam(
        "wallet",
        "The wallet name to sign this transaction. wallet:add first"
    )
    .addOptionalParam("password", "password for decrypting wallet")
    .addOptionalParam("privateKey", "private key")
    .addOptionalParam(
        "jsonKeyfile",
        "json key file to sign tx.",
        undefined,
        types.inputFile
    )
    .addOptionalParam("ledger", "address of ledger for sign")
    .setAction(async (taskArgs, hre) => {
        const signer: Signer = await hre.run("signer", taskArgs);

        console.log(`=== INPUT ===`);
        console.log(`signer: ${await signer.getAddress()}`);
        console.log(`address: ${taskArgs.address}`);
        console.log(`functionSig: ${taskArgs.functionSig}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`estimateGas: ${taskArgs.estimateGas}`);
        console.log(`block: ${taskArgs.block}`);
        console.log(`=============\n`);

        const functionFragment = FunctionFragment.from(taskArgs.functionSig);
        const args = parseCallArgs(taskArgs.args, functionFragment);

        const result = await hre.run("call-internal", {
            address: taskArgs.address,
            functionFragment: functionFragment,
            args: args,
            block: taskArgs.block,
            signer: signer,
            estimateGas: taskArgs.estimateGas,
        });

        if (result["transactionHash"]) {
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
                        value.hex ? bigintToString(BigInt(value.hex)) : value,
                    2
                )
            );
        } else {
            printResult("", result, 0);
        }
    });

task("send", "Send base coin to")
    .addPositionalParam("address", "address to send to")
    .addPositionalParam("amount", "amount to send (unit=ETH)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam(
        "wallet",
        "The wallet name to sign this transaction. wallet:add first"
    )
    .addOptionalParam(
        "jsonKeyfile",
        "json key file to sign tx.",
        undefined,
        types.inputFile
    )
    .addOptionalParam("ledger", "address of ledger for sign")
    .setAction(async (taskArgs, hre) => {
        const signer: Signer = await hre.run("signer", taskArgs);

        console.log(`=== INPUT ===`);
        console.log(`address: ${taskArgs.address}`);
        console.log(`amount: ${taskArgs.amount}`);
        console.log(`=============\n`);

        console.log("before...");
        console.log(
            `sender bal: ${hre.ethers.utils.formatEther(
                await signer.getBalance()
            )}`
        );
        console.log(
            `recipient bal: ${hre.ethers.utils.formatEther(
                await hre.ethers.provider.getBalance(taskArgs.address)
            )}`
        );

        let tx = await signer.sendTransaction({
            to: taskArgs.address,
            value: hre.ethers.utils.parseEther(taskArgs.amount),
        });
        let receipt = await tx.wait();
        console.log(receipt);

        console.log("after...");
        console.log(
            `sender bal: ${hre.ethers.utils.formatEther(
                await signer.getBalance()
            )}`
        );
        console.log(
            `recipient bal: ${hre.ethers.utils.formatEther(
                await hre.ethers.provider.getBalance(taskArgs.address)
            )}`
        );
    });

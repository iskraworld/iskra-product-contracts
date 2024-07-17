import { Signer } from "ethers";
import { subtask, task, types } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";

import { parseCallArgs } from "./util";

subtask("deploy-internal")
    .addParam("contract", "contract name", undefined, types.string, false)
    .addOptionalParam("args", "arguments", [], {
        name: "array",
        validate: (_argName: string, _argumentValue: any) =>
            Array.isArray(_argumentValue),
    })
    .addParam("signer", "signer", undefined, types.any, false)
    .setAction(async (taskArgs, hre) => {
        const factory = await hre.ethers.getContractFactory(taskArgs.contract);
        const contract = await factory
            .connect(taskArgs.signer)
            .deploy(...taskArgs.args);
        await contract.deployed();
        return contract.address;
    });

task("deploy", "Deploy a contract from the source.")
    .addPositionalParam("contract", "contract name.")
    .addOptionalVariadicPositionalParam("args", "constructor arguments.", [])
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam(
        "wallet",
        "The wallet name to sign this transaction. wallet:add first"
    )
    .addOptionalParam("password", "password for decrypting wallet")
    .addOptionalParam(
        "jsonKeyfile",
        "json key file to sign tx.",
        undefined,
        types.inputFile
    )
    .addOptionalParam("ledger", "address of ledger for sign")
    .addOptionalParam("privateKey", "private key")
    .setAction(async (taskArgs, hre) => {
        const signer: Signer = await hre.run("signer", taskArgs);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${await signer.getAddress()}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`=============\n`);

        const factory = await hre.ethers.getContractFactory(taskArgs.contract);
        const args = parseCallArgs(taskArgs.args, factory.interface.deploy);

        const result = await hre.run("deploy-internal", {
            contract: taskArgs.contract,
            args: args,
            signer: signer,
        });
        console.log(`contract address: ${result}`);
        return result;
    });

task(
    "deploy:transparent-upgradeable",
    "Deploy an openzeppelin upgradeable contract from the source."
)
    .addPositionalParam("contract", "contract name.")
    .addOptionalVariadicPositionalParam("args", "initialize arguments.", [])
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
    .addOptionalParam("privateKey", "private key")
    .setAction(async (taskArgs, hre) => {
        const signer: Signer = await hre.run("signer", taskArgs);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${await signer.getAddress()}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`=============\n`);

        const factory = await hre.ethers.getContractFactory(taskArgs.contract);
        const functionFragment = factory.interface.getFunction("initialize");
        const args = parseCallArgs(taskArgs.args, functionFragment);
        const contract = await hre.upgrades.deployProxy(
            factory.connect(signer),
            args
        );
        await contract.deployed();

        console.log(`contract: ${contract.address}`);
        return contract.address;
    });

task(
    "deploy:beacon-upgradeable",
    "Deploy an openzeppelin beacon upgradeable contract from the source."
)
    .addPositionalParam("contract", "contract name.")
    .addOptionalVariadicPositionalParam("args", "initialize arguments.", [])
    .addOptionalParam("beacon", "beacon address.")
    .addOptionalParam("initialize", "initialize function", "initialize")
    .addOptionalParam("quantity", "quantity", 1, types.int)
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
    .addOptionalParam("privateKey", "private key")
    .setAction(async (taskArgs, hre) => {
        const signer: Signer = await hre.run("signer", taskArgs);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${await signer.getAddress()}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`beacon: ${taskArgs.beacon}`);
        console.log(`initialize: ${taskArgs.initialize}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`quantity: ${taskArgs.quantity}`);
        console.log(`=============\n`);

        const implFactory = await hre.ethers.getContractFactory(
            taskArgs.contract,
            signer
        );

        let beaconAddress = taskArgs.beacon;
        if (!beaconAddress) {
            const impl = await implFactory.deploy();
            await impl.deployed();
            console.log(`implementation: ${impl.address}`);

            const beaconFactory = await hre.ethers.getContractFactory(
                "UpgradeableBeacon",
                signer
            );
            const beacon = await beaconFactory.deploy(impl.address);
            await beacon.deployed();

            beaconAddress = beacon.address;
        }

        const addresses: string[] = [];
        for (let i = 0; i < taskArgs.quantity; i++) {
            const functionFragment = implFactory.interface.getFunction(
                taskArgs.initialize
            );
            const args = parseCallArgs(taskArgs.args, functionFragment);
            const initData = implFactory.interface.encodeFunctionData(
                functionFragment,
                args
            );
            const proxyFactory = await hre.ethers.getContractFactory(
                "BeaconProxy",
                signer
            );
            const proxy = await proxyFactory.deploy(beaconAddress, initData);
            await proxy.deployed();

            addresses.push(proxy.address);
        }

        console.log(`beacon: ${beaconAddress}`);
        console.log(`contract: ${addresses}`);
        return addresses;
    });

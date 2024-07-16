import { subtask, task } from "hardhat/config";
import path from "path";
import fs from "fs";
import os from "os";
import { Wallet } from "ethers";
import { question } from "./util";

const walletDir = path.join(os.homedir(), ".iskra-console", "wallet");

task("wallet:add", "add a new wallet account")
    .addPositionalParam("name", "name of this account")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        if (walletExist(taskArgs.name)) {
            console.error(
                `wallet [${taskArgs.name}] is exist already. try another name`
            );
            return;
        }
        const wallet = hre.ethers.Wallet.createRandom();
        if (
            await walletSave(
                taskArgs.name,
                taskArgs.password ?? question("Password", true),
                wallet
            )
        ) {
            console.log(`wallet [${taskArgs.name}] is added`);
        } else {
            console.log(`adding wallet [${taskArgs.name}] is failed`);
        }
    });

task("wallet:import", "import a wallet from private key")
    .addPositionalParam("name", "name of this account")
    .addOptionalParam("privatekey", "the private key of this account")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        if (walletExist(taskArgs.name)) {
            console.error(
                `wallet [${taskArgs.name}] is exist already. try another name`
            );
            return;
        }
        const wallet = new hre.ethers.Wallet(
            taskArgs.privatekey ?? question("PrivateKey", true),
            hre.ethers.provider
        );
        if (
            await walletSave(
                taskArgs.name,
                taskArgs.password ?? question("Password", true),
                wallet
            )
        ) {
            console.log(`wallet [${taskArgs.name}] is imported`);
        } else {
            console.log(`importing wallet [${taskArgs.name}] is failed`);
        }
    });

task("wallet:delete", "delete a wallet")
    .addPositionalParam("name", "name of this account")
    .setAction(async (taskArgs, hre) => {
        if (!walletExist(taskArgs.name)) {
            console.error(
                `wallet [${taskArgs.name}] is not exist. try another name`
            );
            return;
        }
        if (await walletDelete(taskArgs.name)) {
            console.log(`wallet [${taskArgs.name}] is deleted`);
        } else {
            console.log(`deleting wallet [${taskArgs.name}] is failed`);
        }
    });

task("wallet:list", "list names of wallet").setAction(async (taskArgs, hre) => {
    console.log(walletList());
});

task("wallet:show", "show a wallet stored")
    .addPositionalParam("name", "name of this account")
    .addFlag("a", "show address only")
    .setAction(async (taskArgs, hre) => {
        const walletContent = walletShow(taskArgs.name);
        let walletContentJson = JSON.parse(walletContent);
        if (taskArgs.a) {
            walletContentJson = walletContentJson.address;
        }
        console.log(walletContentJson);
    });

subtask("wallet:path", "returns a wallet path")
    .addParam("name", "name of this account")
    .setAction(async (taskArgs, hre) => {
        const walletJson = path.join(walletDir, taskArgs.name);
        if (!fs.existsSync(walletJson)) {
            throw new Error(`wallet [${taskArgs.name}] is not exist`);
        }
        return walletJson;
    });

function walletExist(name: string) {
    const walletJson = path.join(walletDir, name);
    return fs.existsSync(walletJson);
}

async function walletSave(name: string, password: string, wallet: Wallet) {
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
        throw err;
    }
    return success;
}

async function walletDelete(name: string) {
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

function walletList() {
    return fs.readdirSync(walletDir);
}

function walletShow(name: string) {
    const walletJson = path.join(walletDir, name);
    if (!fs.existsSync(walletJson)) {
        throw new Error(`wallet [${name}] is not exist`);
    }
    return fs.readFileSync(walletJson, "utf-8");
}

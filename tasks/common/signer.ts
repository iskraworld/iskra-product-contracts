import { subtask, types } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

import { LedgerSigner } from "./ledger-signer";
import { loadKeyfile } from "./util";

subtask("signer")
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
        let signer;
        if (taskArgs.signer) {
            signer = await hre.ethers.getSigner(taskArgs.signer);
        } else if (taskArgs.wallet) {
            const walletPath = await hre.run("wallet:path", {
                name: taskArgs.wallet,
            });
            signer = await loadKeyfile(hre, walletPath, taskArgs.password);
        } else if (taskArgs.privateKey) {
            signer = new hre.ethers.Wallet(
                taskArgs.privateKey,
                hre.ethers.provider
            );
        } else if (taskArgs.jsonKeyfile) {
            signer = await loadKeyfile(
                hre,
                taskArgs.jsonKeyfile,
                taskArgs.password
            );
        } else if (taskArgs.ledger) {
            signer = await LedgerSigner.create(
                taskArgs.ledger,
                hre.ethers.provider
            );
        } else {
            [signer] = await hre.ethers.getSigners();
        }
        return signer;
    });

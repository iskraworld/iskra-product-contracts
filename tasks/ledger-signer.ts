import { Bytes, Signer, UnsignedTransaction } from "ethers";
import {
    defineReadOnly,
    getAddress,
    hashMessage,
    resolveProperties,
} from "ethers/lib/utils";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import { joinSignature } from "@ethersproject/bytes";
import { serialize } from "@ethersproject/transactions";
import { default as Ledger, ledgerService } from "@ledgerhq/hw-app-eth";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

export class LedgerSigner extends Signer {
    public static readonly TIMEOUT = 3000;
    public static readonly NUM_ACCOUNT_COUNT = 20;
    public static readonly DEFAULT_PATH_FORM = "44'/60'/0'/0/*";

    readonly #path: string;
    readonly #ledger: Ledger;

    private constructor(
        readonly address: string,
        readonly publicKey: string,
        path: string,
        ledger: Ledger,
        provider: Provider
    ) {
        super();

        if (!provider || !Provider.isProvider(provider)) {
            throw new Error("invalid provider");
        }

        this.#path = path;
        this.#ledger = ledger;

        defineReadOnly(this, "provider", provider || null);
    }

    connect(provider: Provider): Signer {
        return new LedgerSigner(
            this.address,
            this.publicKey,
            this.#path,
            this.#ledger,
            provider
        );
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    async signTransaction(transaction: TransactionRequest): Promise<string> {
        const tx = await resolveProperties(transaction);
        if (tx.from != null) {
            if (getAddress(tx.from) !== this.address) {
                throw new Error("transaction from address mismatch");
            }
            delete tx.from;
        }
        const txToSign = serialize(<UnsignedTransaction>tx).slice(2);
        const resolution = await ledgerService.resolveTransaction(
            txToSign,
            {},
            {}
        );

        const sig = await this.#ledger.signTransaction(
            this.#path,
            txToSign,
            resolution
        );
        return serialize(<UnsignedTransaction>tx, {
            v: Number(sig.v),
            r: `0x${sig.r}`,
            s: `0x${sig.s}`,
        });
    }

    async signMessage(message: Bytes | string): Promise<string> {
        const digest = hashMessage(message);
        const sig = await this.#ledger.signPersonalMessage(
            this.#path,
            digest.slice(2)
        );
        return joinSignature({
            v: Number(sig.v),
            r: `0x${sig.r}`,
            s: `0x${sig.s}`,
        });
    }

    public static async create(
        address: string,
        provider: Provider,
        pathForm: string = LedgerSigner.DEFAULT_PATH_FORM
    ) {
        const openTimeout = LedgerSigner.TIMEOUT;
        const connectionTimeout = LedgerSigner.TIMEOUT;

        let ledger: Ledger;
        try {
            const transport = await TransportNodeHid.create(
                openTimeout,
                connectionTimeout
            );
            ledger = new Ledger(transport);
        } catch (error) {
            throw error;
        }

        for (let i = 0; i < LedgerSigner.NUM_ACCOUNT_COUNT; i++) {
            const path = pathForm.replace("*", i.toString());
            const account = await ledger.getAddress(path);

            if (account.address == address) {
                return new LedgerSigner(
                    account.address,
                    account.publicKey,
                    path,
                    ledger,
                    provider
                );
            }
        }

        throw new Error("cannot find the address from the ledger device");
    }
}

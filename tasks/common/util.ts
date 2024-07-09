import { BigNumber } from "ethers";
import { Fragment, ParamType } from "@ethersproject/abi";
import fs from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as readlineSync from "readline-sync";

export function question(title: string, shouldConfirm = false) {
    const answer = readlineSync.question(`${title}:`, {
        hideEchoBack: true,
        mask: "",
    });

    if (shouldConfirm) {
        const confirm = readlineSync.question(`Confirm ${title}:`, {
            hideEchoBack: true,
            mask: "",
        });
        if (answer !== confirm) {
            throw new Error("Confirmation does not match.");
        }
    }
    return answer;
}

export async function loadKeyfile(
    hre: HardhatRuntimeEnvironment,
    jsonKeyfile: string,
    password: string | undefined
) {
    if (!fs.existsSync(jsonKeyfile)) {
        throw new Error(`${jsonKeyfile} is not exist`);
    }

    async function retry(
        fn: (error: any) => Promise<any>,
        retries: number = 3,
        error: any = null
    ): Promise<any> {
        if (!retries) {
            return Promise.reject(error);
        }
        try {
            return await fn(error);
        } catch (errorAgain) {
            return retry(fn, retries - 1, errorAgain);
        }
    }

    try {
        return await retry(async (error: any) => {
            if (error) {
                console.warn(`${error.toString()}, try again!`);
            }
            const content = fs.readFileSync(jsonKeyfile, "utf8");
            const wallet = await hre.ethers.Wallet.fromEncryptedJson(
                content,
                password ?? question("Password")
            );
            return wallet.connect(hre.ethers.provider);
        });
    } catch (error: any) {
        throw new Error(error.toString());
    }
}

export function parseCallArgs(args: string[], fragment: Fragment) {
    if (fragment.inputs.length != args.length) {
        throw new Error("invalid argument count");
    }

    return fragment.inputs.map(
        (paramType: ParamType, index: number) =>
            parse(paramType, args[index], 0).value
    );
}

function parse(
    type: ParamType,
    input: string,
    offset: number
): {
    value: string | bigint | any | any[];
    offset: number;
} {
    if (offset > input.length) {
        throw new Error(`Parse error. at ${type.name}`);
    }
    if (type.baseType === "array") {
        return parseArray(type, input, offset);
    } else if (type.baseType === "tuple") {
        return parseTuple(type, input, offset);
    } else {
        return parsePrimitive(type, input, offset);
    }
}

function parseArray(
    type: ParamType,
    input: string,
    offset: number
): { value: any[]; offset: number } {
    if (input.charAt(offset) !== "[") {
        throw new Error("tuple must starts with '['.");
    }

    let value: any[] = [];

    if (type.arrayChildren!.baseType.includes("int")) {
        const rangeExp =
            /^\[(?<start>\d+)..(?<end>\d+)(?<shuffle>\s+shuffle)?\]/m;
        let match = rangeExp.exec(input.slice(offset));
        if (match) {
            offset += match.input.length;
            const start = Number(match.groups!.start);
            const end = Number(match.groups!.end);
            const shuffle = match.groups!.shuffle !== undefined;

            value = Array.from(
                { length: end - start + 1 },
                (_, index) => index + start
            );
            if (shuffle) {
                value = value
                    .map((item) => ({ item, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ item }) => item);
            }

            return { value, offset };
        }
    }

    offset++;
    let parseFunc;
    if (type.arrayChildren!.baseType === "array") {
        parseFunc = parseArray;
    } else if (type.arrayChildren!.baseType === "tuple") {
        parseFunc = parseTuple;
    } else {
        parseFunc = parsePrimitive;
    }

    while (input.charAt(offset) !== "]") {
        const parsed = parseFunc(type.arrayChildren!, input, offset);
        value.push(parsed.value);
        offset = parsed.offset;
        if (input.charAt(offset) === ",") {
            offset++;
        }
    }
    offset++;

    return { value, offset };
}

function parseTuple(
    type: ParamType,
    input: string,
    offset: number
): { value: any; offset: number } {
    if (input.charAt(offset) !== "[") {
        throw new Error("tuple must starts with '['.");
    }
    offset++;

    let value: any = {};
    for (const [i, component] of type.components!.entries()) {
        const parsed = parse(component, input, offset);
        value[component.name ?? i.toString()] = parsed.value;
        // value.push(parsed.value);
        offset = parsed.offset;
        if (Object.keys(value).length < type.components!.length) {
            if (input.charAt(offset) !== ",") {
                throw new Error(
                    `invalid tuple item. expected ',' at ${offset} ('${type.name}')`
                );
            }
        } else {
            if (input.charAt(offset) !== "]") {
                throw new Error(
                    `invalid tuple item. expected ']' at ${offset} ('${type.name}')`
                );
            }
        }
        offset++;
    }

    return { value, offset };
}

function parsePrimitive(
    type: ParamType,
    input: string,
    offset: number
): { value: string | bigint; offset: number } {
    const start = offset;
    const found = input.slice(offset).search(/[^\\][\[\],]/gm);
    offset = found > -1 ? start + found + 1 : input.length;

    let value: string | bigint;
    let parsed = input.slice(start, offset);
    if (type.baseType.includes("int")) {
        value = parseBigInt(parsed);
    } else {
        value = parsed.replace(/\\([\[,\]])/gm, "$1");
    }
    return { value, offset };
}

export function parseBigInt(value: string) {
    // allowable format:
    //   19_999e+18
    //   10e18
    //   100_000
    //   10000

    let match = /^(?<integer>[+-]?[\d_]+)(e(?<exponent>[+-]?\d+))?$/.exec(
        value
    );
    if (match) {
        const integer = match.groups!.integer;
        const exponent = match.groups!.exponent;
        if (!/^[+-]?\d{1,3}((_\d{3})*|\d*)$/.test(integer)) {
            throw Error(`invalid delimiter: ${integer}`);
        }
        let ret = BigInt(integer.replace(/_/g, ""));
        if (exponent) {
            ret = ret * 10n ** BigInt(exponent);
        }
        return ret;
    } else {
        throw Error(`invalid number format: ${value}`);
    }
}

export function bigintToString(value: bigint) {
    let strValue = value.toString();
    if (strValue.length > 18) {
        strValue =
            strValue.substring(0, strValue.length - 18) +
            "_" +
            strValue.substring(strValue.length - 18);
    }
    return strValue;
}

export function printResult(name: string, item: any, indent: number) {
    if (Array.isArray(item)) {
        if (item.length > 0) {
            if (name) {
                console.log("  ".repeat(indent) + name + ": [");
            } else {
                console.log("  ".repeat(indent) + "[");
            }

            for (let key of Object.keys(item).slice(-item.length)) {
                printResult(key, item[key as keyof typeof item], indent + 1);
            }
            console.log("  ".repeat(indent) + "]");
        } else {
            console.log("  ".repeat(indent) + name + ": []");
        }
    } else {
        let value = item;
        if (item instanceof BigNumber) {
            value = item.toString();
            if (value.length > 18) {
                value =
                    value.substring(0, value.length - 18) +
                    "_" +
                    value.substring(value.length - 18);
            }
        }
        if (name) {
            console.log("  ".repeat(indent) + name + ": " + value);
        } else {
            console.log("  ".repeat(indent) + value);
        }
    }
}

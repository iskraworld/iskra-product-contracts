ISKRA MultiToken(ERC1155) Contract and Commands
===
*Before jump into further, [the happy case test shell](.multitoken.test.sh) is highly recommended to execute*

## Environments
### compile

Compiles the entire project, building all artifacts

```
npx hardhat compile
```

### test

Runs mocha tests

```
npx hardhat test
```

### abi

Exports contracts ABIs

```
npm run abi
```

### formatter

Rewrite sources with prettier formatter

```
npm run format
```

### lint

Check source format

```
npm run lint
```

## Commands
```
npx hardhat --help
```
### wallet
```
npx hardhat wallet:add --name [name]
...
```
### transaction
```
npx hardhat getTransaction --hash [hash] 
...
```
### multitoken
```
npx hardhat multitoken:deploy --signer [signer] --password [password]
...
```

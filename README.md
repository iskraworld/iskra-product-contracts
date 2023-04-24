ISKRA tokens(ERC20, ERC721, ERC1155), vesting contracts and commands
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
List all hardhat commands
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
npx hardhat multitoken:deploy
...
```
For more information, please refer [MultiToken](doc/kor/multi_token.md)

### gametoken
```
npx hardhat gametoken:deploy --name [name] --symbol [symbol] --supply [supply; 1 = 10**decimals]
ex)
npx hardhat gametoken:deploy --name "Sample token" --symbol SMP --supply 1000000000
```
For more information, please refer [GameToken](doc/kor/game_token.md)

### utilitytoken
```
npx hardhat utilitytoken:deploy --name [name] --symbol [symbol] --minter [first minter address]
ex)
npx hardhat utilitytoken:deploy --name Candy --symbol CND --minter 0x1ABC7154748D1CE5144478CDEB574AE244B939B5
```
For more information, please refer [GameToken](doc/kor/utility_token.md)

### itemnft
```
npx hardhat itemnft:deploy
...
```
For more information, please refer [ItemNFT](doc/kor/item_nft.md)

### vesting
```
// At first, you should deploy the vesting implementation contract, and then deploy serveral vesting proxy contracts for beneficiaries
npx hardhat vesting:deploy_impl
// then `~/.iskra_console/deploy/vesting-impl-address.json` file created

// Next, deploy vesting proxy contract; --beacon is optional
npx hardhat vesting:deploy {--beacon [beacon address; use the output from vesting:deploy_impl]}

// Next, you should approve game token to prepare vesting; --token is optional
npx hardhat gametoken:approve --spender [vesting proxy contract address] --amount 10000 {--token [game token address]}

// Next, prepare vesting contract for a beneficiary
npx hardhat vesting:prepare --beneficiary [a beneficiary address] --amount 10000 {--vesting [vesting proxy]} {--token [game token]} {--duration [duration; default is 36]}

// Next, set start time for vesting contract
npx hardhat vesting:setstart --start "2022-05-01 09:00:00" {--vesting [vesting proxy]}

// You can do [vesting:deploy ~ vesting:setstart] at once
npx hardhat vesting:one_stop_setup --beneficiary 0xc4417F73DaC656337cEcfee8c784130f08be4FA7 --amount 10000 --start "2022-05-01 09:00:00"
```
For more information, please refer [Vesting](doc/kor/vesting.md)


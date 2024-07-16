# ISKRA Utility Token(ERC20) Contract

## 개요
- `contracts/token/ERC20/UtilityToken.sol` 파일은 ERC20 표준을 따르는 샘플 토큰 구현체로서, 이름(name), 심볼(symbol), 최초 minter를 배포 때 정할 수 있도록 구현된 토큰입니다.
- 배포시 초기 발행량은 0이며, minter 권한이 있는 account로 mint나 burn을 할 수 있습니다.
- minter는 무제한 발행이 가능합니다.
- owner는 minter를 추가/삭제할 수 있습니다.
- decimal은 18로 고정입니다.
- IERC20, IERC20Metadata, IERC165 표준 인터페이스를 따릅니다.
- `iskra-product-contracts`에서는 ERC20 토큰의 `배포`, `mint`, `addMinter`, `removeMinter`, `approve`, `transfer` 기능을 수행할 수 있습니다.

## 빌드
소스 코드를 다운 받습니다. npm, git 등은 설치되어 있다고 가정합니다.
```
git clone https://github.com/iskraworld/iskra-product-contracts.git
```
<br>
그런 후 의존성 모듈들을 설치합니다.

```
npm install
```
<br>
그리고 컴파일 합니다.

```
npx hardhat compile
```

## 지갑 준비
- 기본적으로 hardhat config에 배포 계정이 세팅되어 있어, 테스트 목적으로 배포할 땐 별도의 배포 계정을 준비할 필요가 없습니다.
- hardhat config에 설정된 계정이 아닌, 지정한 계정으로 배포를 수행하려면 세가지 방법이 있습니다
    - `npx hardhat wallet:add` 로 등록한 wallet 사용
        - 사전에  `wallet:add` 명령어로 지갑을 생성합니다.
        - ```
          npx hardhat wallet:add [name] [--password [password]]

          ex)
            npx hardhat wallet:add deployer
            Password:
            Confirm Password:
            wallet [deployer] is added
          ```
        - `--wallet [wallet name]` 옵션을 사용합니다.
        - ```
          npx hardhat deploy ... --wallet deployer
          ```
        - 보다 자세한 wallet 이용법은 [Wallet](wallet.md)를 참조하세요.
    - 임의의 로컬 저장소의 Json Keyfile 사용
        - `--json-keyfile [keyfile path]` 옵션을 사용합니다.
        - ```
          npx hardhat deploy ... --json-keyfile ../deployer.keyfile.json
          ```
    - Hardware Wallet 사용
        - `--ledger [ledger address]` 옵션을 사용합니다.
        - ```
          npx hardhat deploy ... --ledger 0x3e947aE0A245AcD51A1e1021fE8B50c22D215758
          ```
- hardhat node가 아닌 외부 블록체인(klaytn, ethereum, base)에 배포하려면 기본 계정에 base coin(Klay 또는 Ether 등)이 준비되어 있어야 합니다.


## 네트워크 선택
- 모든 커맨드에 네트워크 옵션(`--network`)을 줄 수 있습니다. 네트워크 옵션을 주지 않으면 hardhat node(local)에서 수행됩니다.
- 네트워크 설정은 `harhat.config.js`에 있습니다. 기본적으로 다음 네트워크를 지원합니다. 필요시 네트워크 정보를 추가하시기 바랍니다.
    - `baobab`: Klaytn testnet
    - `cypress`: Klaytn mainnet
    - `sepolia`: Ethereum testnet
    - `ethereum`: Ethereum mainnet
    - `baseSepolia`: Base testnet
    - `base`: Base mainnet
- 예로 Base testnet에서 수행하려면 아래처럼 옵션을 주면 됩니다.

```
npx hardhat deploy ... --network baseSepolia
```
- [주의] hardhat node는 매번 수행될 때마다 체인이 리셋(초기화) 됩니다. 따라서 커맨드 실행과 실행 사이에 연속성이 없기 때문에 배포한 컨트랙트를 새로운 커맨드로 실행할 수가 없습니다.

## 배포

다음 명령어로 Utility token 컨트랙트를 배포할 수 있습니다.

```
npx hardhat deploy UtilityToken [name] [symbol] [first minter]

ex)
npx hardhat deploy UtilityToken "CandyToken" CND 0x1ABC7154748D1CE5144478CDEB574AE244B939B5 --network baseSepolia
=== INPUT ===
deployer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
contract: UtilityToken
args: CandyToken,CND,0x1ABC7154748D1CE5144478CDEB574AE244B939B5
=============

contract address: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
```

- `--network` 옵션으로 체인을 선택할 수 있습니다.
- 성공적으로 배포되면 위 처럼 배포된 컨트랙트 주소가 표시됩니다. 예에서는 `0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0`

## mint
- 스크립트로 ERC20 토큰을 mint할 수 있습니다. 단 minter로 등록된 account만 가능합니다.
```
npx hardhat call [token address] UtilityToken mint [recipient] [amount; decimals 고려한 수량]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 UtilityToken mint 0x1ABC7154748D1CE5144478CDEB574AE244B939B5 1_000e18
```

## addMinter
- 스크립트로 minter를 등록합니다.
```
npx hardhat call [token address] UtilityToken addMinter [new minter]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 UtilityToken addMinter 0x1ABC7154748D1CE5144478CDEB574AE244B939B5
```

## removeMinter
- 스크립트로 minter를 제거합니다.
```
npx hardhat call [token address] UtilityToken removeMinter [minter]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 UtilityToken removeMinter 0x1ABC7154748D1CE5144478CDEB574AE244B939B5
```

## approve
- 스크립트로 ERC20의 approve 기능을 수행할 수 있습니다.
```
npx hardhat call [token address] UtilityToken approve [spender] [amount; decimals 고려한 수량]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 UtilityToken approve 0xc4417F73DaC656337cEcfee8c784130f08be4FA7 1_000e18 --network baseSepolia
=== INPUT ===
signer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
address: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
contract: GameToken
function: approve
args: 0xc4417F73DaC656337cEcfee8c784130f08be4FA7,1_000e18
estimateGas: false
block: undefined
chunking: undefined
chunkingLimit: 200
=============

{
  "transactionHash": "0xc142714648dcf62791fcdc74fa5e6334d5c32bf321851bd7e3dd5a61272530dc",
  "blockNumber": 1,
  "blockHash": "0xba65e21e85ffb1a72c3b5f3dbaefeab4c5bea145378977618f9bfd412d0d35a0",
  "transactionIndex": 0,
  "from": "0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D",
  "to": "0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0",
  "gasUsed": "21644",
  "cumulativeGasUsed": "21644",
  "effectiveGasPrice": "1250000000",
  "status": 1
}

```
- `--network` 옵션으로 체인을 선택할 수 있습니다.
- `[token address]` 에 `approve` 할 토큰을 지정하여야 합니다.
- `[amount]` 에는 decimals 를 포함한 수를 넣어야 합니다. `e18` 로 `0` 18개를 추가하여 decimals 를 포함하였습니다.

## transfer
- 스크립트로 ERC20의 transfer 기능을 수행할 수 있습니다.

```
npx hardhat call [token address] UtilityToken transfer [spender] [amount; decimals 고려한 수량]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 UtilityToken transfer 0xc4417F73DaC656337cEcfee8c784130f08be4FA7 1_000e18 --network baseSepolia
=== INPUT ===
signer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
address: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
contract: GameToken
function: transfer
args: 0xc4417F73DaC656337cEcfee8c784130f08be4FA7,1_000e18
estimateGas: false
block: undefined
chunking: undefined
chunkingLimit: 200
=============

{
  "transactionHash": "0x6aebb49970ac2e0de9c9aad9657ce5dfc0fdbca22db6ecdfdc03eb107b90b63f",
  "blockNumber": 1,
  "blockHash": "0xe3c985770d52b1d0dfc7c4c1c9947cd7845fd8f2ac0e23250f5629adfba2e688",
  "transactionIndex": 0,
  "from": "0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D",
  "to": "0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0",
  "gasUsed": "21644",
  "cumulativeGasUsed": "21644",
  "effectiveGasPrice": "1250000000",
  "status": 1
}

```
- `--network` 옵션으로 체인을 선택할 수 있습니다.
- `[token address]` 에 `transfer` 할 토큰을 지정하여야 합니다.
- `[amount]` 에는 decimals 를 포함한 수를 넣어야 합니다. `e18` 로 `0` 18개를 추가하여 decimals 를 포함하였습니다.

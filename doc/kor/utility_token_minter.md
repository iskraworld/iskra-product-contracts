# Utility Token Minter

## 개요
- xToken으로 Token Mint 하기위한 task의 모음입니다.

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


## 배포하기

```
npx hardhat deploy UtilityTokenMinter [token] [paymentToken] [treasury] [shareRecipient] [sharePerMillion] [vestingBeacon] [unlockPeriodHours] [vestingDuration]
```

- 옵션 설명
  - 발행 옵션
    - [token]: 발행 토큰 주소
    - [paymentToken]: 발행을 위해 지불 할 토큰(xToken)
    - [treasury]: 발행할 때에 지불된 토큰(xToken)의 저장소, EOA를 선택할 수도 있고 0xdead의 소각 주소를 지정할 수도 있습니다.
  - 발행 수수료 옵션
    - [shareRecipient]: 발행 수수료의 수령 주소
    - [sharePerMillion]: 발행 수수료율 (per million), 1,000,000 = 100%
  - 발행 수수료 Vesting 옵션
    - [vestingBeacon]: Vesting Beacon 주소. [Vesting](vesting.md)를 참조하세요.
    - [unlockPeriodHours]: 베스팅 unlock 단위 시간을 설정합니다. 이 시간마다 일정 물량이 unlock이 됩니다.
    - [vestingDuration]: 베스팅 총 기간을 설정합니다. period 기간을 총 몇 번 할지 설정합니다.

```
ex)
npx hardhat deploy UtilityTokenMinter \
  0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c 0x399f960ED9D68533CE597742685564d533e0C077 0x3A4C7d6Ee5177E4d7D31CEA4Be3396e778340b43 \
  0xD11eEf7D5e5FE067B93E58BAb30B4F62332BD6ad 100_000 \
  0x06a9b526545eE6206aCaD37493a97573B2305EBE 730 36 \
  --network baseSepolia

=== INPUT ===
deployer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
contract: UtilityTokenMinter
args: 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c,0x399f960ED9D68533CE597742685564d533e0C077,0x3A4C7d6Ee5177E4d7D31CEA4Be3396e778340b43,0xD11eEf7D5e5FE067B93E58BAb30B4F62332BD6ad,100_000,0x06a9b526545eE6206aCaD37493a97573B2305EBE,730,36
=============

contract address: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
```

## 권한 추가하기
- 배포한 minter 컨트랙트가 발행을 대행할 수 있도록 발행할 Token에 minting 권한을 추가합니다.
- Token의 owner가 실행하여야 합니다.
- `npx hardhat call [token] UtilityToken addMinter [minter contract]`
- 옵션 설명
    - [token]: 발행할 토큰을 지정합니다.
    - [minter contract]: minter 컨트랙트를 지정합니다.
```
ex)
npx hardhat call 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c UtilityToken addMinter 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 --network baseSepolia
=== INPUT ===
signer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
address: 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c
contract: UtilityToken
function: addMinter
args: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
estimateGas: false
block: undefined
chunking: undefined
chunkingLimit: 200
=============

{
  "transactionHash": "0x6a81ead2032d8587f81831b6d8112fa5c457a0ed0cdb2239414d2221064b9822",
  "blockNumber": 1,
  "blockHash": "0x8d6a51d9049cbedcbcd0b3f5b5ef1bba21c677ea0ada9b57ac6a0824896811d3",
  "transactionIndex": 0,
  "from": "0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D",
  "to": "0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c",
  "gasUsed": "21784",
  "cumulativeGasUsed": "21784",
  "effectiveGasPrice": "1250000000",
  "status": 1
}
```


## 토큰 발행 하기
- 원하는 수량 만큼의 토큰을 발행합니다.
- 이 때에, 같은 수량의 지불 토큰(xToken)이 recipient 으로부터 미리 지정된 주소(treasury)로 옮겨집니다.
  - 따라서 이 작업을 수행하기 전에 수령인이 먼저 해당 토큰의 `approve`를 먼저 수행해야 합니다.
      - ```
        npx hardhat call [paymentToken] IERC20 approve [minter contract] [amount; decimals 를 고려한 amount 예)100개=100e18]
        ```
- `npx hardhat call [minter contract] UtilityTokenMinter mint [recipient] [amount] [useVestingForShare]`
- 옵션 설명
    - [minter contract]: minter 컨트랙트를 지정합니다.
    - [recipient]: 발행된 토큰의 수령주소 입니다. 또한 지불 토큰(xToken)의 소유자이기도 합니다.
    - [amount]: 발행 수량입니다. decimals 를 고려여야 합니다. 예) 100개 = 100e18 or 100000000000000000000
    - [useVestingForShare] 발행수수료의 일시지급 or vesting지급을 선택합니다. (일시지급: false, vesting지급: true)
```
ex)
npx hardhat call 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c UtilityTokenMinter mint 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D 100e18 false --network baseSepolia
=== INPUT ===
signer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
address: 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c
contract: UtilityTokenMinter
function: mint
args: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D,100e18,false
estimateGas: false
block: undefined
chunking: undefined
chunkingLimit: 200
=============

{
  "transactionHash": "0x6a81ead2032d8587f81831b6d8112fa5c457a0ed0cdb2239414d2221064b9822",
  "blockNumber": 1,
  "blockHash": "0x8d6a51d9049cbedcbcd0b3f5b5ef1bba21c677ea0ada9b57ac6a0824896811d3",
  "transactionIndex": 0,
  "from": "0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D",
  "to": "0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c",
  "gasUsed": "21784",
  "cumulativeGasUsed": "21784",
  "effectiveGasPrice": "1250000000",
  "status": 1
}
```

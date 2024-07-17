# ISKRA Vesting Contract

## 개요
- `contracts/vesting/Vesting.sol` 파일은 베스팅 컨트랙트 구현체로서, 정해진 금액의 토큰을 일정 기간 동안 수령할 수 있도록 한 컨트랙트입니다.
- 베스팅 컨트랙트가 배포되고, 일정 금액의 토큰과 수혜자(beneficiary), 시작 시간을 설정하면 컨트랙트가 활성화됩니다.
- 이 후 정해진 시간(730시간) 마다 일정 물량의 토큰이 unlock되어 수혜자(beneficiary)가 `claim`할 수 있게 됩니다.
- 컨트랙트 owner는 만약을 대비해 언제든지 회수(reclaim)할 수 있습니다. 그러면 남아 있는 토큰을 전량 회수하게 되고, 컨트랙트는 비활성 상태가 됩니다.
- `Vesting` 컨트랙트는 upgrade 가능한 컨트랙트 형태로 배포됩니다. 컨트랙트에 결함이 발견되거나 기능 변경이 불가피하게 필요할 경우 업그레이드를 할 수 있습니다.
- 컨트랙트 업그레이드 기능은 `open zepplin`의 `UpgradeableBeacon`, `BeaconProxy` 구현체를 사용하였습니다.

## 구조
- Vesting 컨트랙트는 다음 3가지 컨트랙트로 구성됩니다.
  - `Vesting Implementation`
  - `Vesting Beacon`
  - `Vesting Proxy`
- `Vesting Implementation`와 `Vesting Beacon`는 한 번만 배포되면 되고, `Vesting Proxy`는 베스팅 수혜자별로 배포되어야 합니다.
- `Vesting Implementation`은 `contracts/vesting/Vesting.sol` 구현체로 배포됩니다.
- `Vesting Beacon`과 `Vesting Proxy`는 `open zepplin` 구현체로 배포됩니다.
- 업그레이드 방법은 여기서 다루지 않습니다.

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

## 배포하기
- `npx hardhat deploy:beacon-upgradeable Vesting`
- 스크립트를 실행하면 `Vesting Implementation`, `Vesting Beacon`, `Vesting Contract` 가 한 번에 배포됩니다.
- 다음 옵션을 지원합니다.
  - `--quantity`(optional): 배포하는 컨트랙트 수를 지정합니다. 수혜자(beneficiary) 수 만큼 지정되어야 합니다.

```
npx hardhat deploy:beacon-upgradeable Vesting [--quantity [contranct 수]]

ex)
npx hardhat deploy:beacon-upgradeable Vesting --quantity 5 --network baseSepolia
=== INPUT ===
deployer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
contract: Vesting
beacon: undefined
initialize: initialize
args:
quantity: 5
=============

implementation: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
beacon: 0x2c606C635C4daf80e97A1Afef7804a4cE30AcAB8
contract: 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c,0x399f960ED9D68533CE597742685564d533e0C077,0x3A4C7d6Ee5177E4d7D31CEA4Be3396e778340b43,0xD11eEf7D5e5FE067B93E58BAb30B4F62332BD6ad,0x06a9b526545eE6206aCaD37493a97573B2305EBE
```
- 스크립트가 성공적으로 배포를 하면 위와 같이 세 종류의 컨트랙트 주소가 출력됩니다.
- implementation: 실행 코드를 담당하는 컨트랙트
- beacon: 실행 코드와 실제 컨트랙트를 연결 하는 컨트랙트
- contract:
    - 수혜자(beneficiary)별로 배포되어야 합니다.
    - 각 베스팅의 상태 정보들을 갖고 있고, 각 수혜자는 이 컨트랙트를 바라보게 됩니다.
    - 실제 배분되는 토큰을 소유하고 있는 컨트랙트입니다.
    - 다음 단계를 거칩니다.
        - initialized: 배포된 초기 상태. 컨트랙트 owner가 정해집니다.
        - prepared: 수혜자(beneficiary), 물량, 토큰, 베스팅 기간을 설정(prepare)하면 prepared 상태가 됩니다. owner만 수행할 수 있습니다.
        - setstart: 시작 시각을 설정합니다.
        - started: 시작 시각이 지나면 started 상태가 되고, 시간이 카운팅됩니다. 이 후부터 매 730시간마다 일정 물량이 unlock됩니다.

## 이미 배포한 Beacon으로 추가 배포하기

```
npx hardhat deploy:beacon-upgradeable Vesting --beacon [beacon address] [--quantity [contranct 수]]

ex)
npx hardhat deploy:beacon-upgradeable Vesting --beacon 0x2c606C635C4daf80e97A1Afef7804a4cE30AcAB8 --quantity 5
=== INPUT ===
deployer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
contract: Vesting
beacon: 0x2c606C635C4daf80e97A1Afef7804a4cE30AcAB8
initialize: initialize
args:
quantity: 5
=============

beacon: 0x2c606C635C4daf80e97A1Afef7804a4cE30AcAB8
contract: 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c,0x399f960ED9D68533CE597742685564d533e0C077,0x3A4C7d6Ee5177E4d7D31CEA4Be3396e778340b43,0xD11eEf7D5e5FE067B93E58BAb30B4F62332BD6ad,0x06a9b526545eE6206aCaD37493a97573B2305EBE
```

- 배포가 되면 `initialized` 상태가 됩니다.
- 이후 컨트랙트 owner(배포자)는 `Prepare`를 수행할 수 있습니다.

## `Vesting Contract` Prepare 하기
- 배포된 초기 상태의 `Vesting Contract`에 다음 정보를 세팅하는 작업을 `Prepare`라고 합니다.
  - `beneficiary`: 베스팅 수혜자
  - `amount`: 베스팅 물량
  - `initial`: 최초 unlock 상태로 배포할 물량
  - `token`: 베스팅 받을 토큰
  - `period`: unlock 단위 시간
  - `duration`: 총 베스팅 기간
- 이 작업을 수행할 때, owner가 가지고 있는 token의 amount 만큼의 수량이 `Vesting Contract`로 옮겨집니다.
- 따라서 이 작업을 수행하기 전에 먼저 해당 토큰의 `approve`를 먼저 수행해야 합니다.
  - ```
    npx hardhat call [token] IERC20 approve [vesting contract] [amount; decimals 를 고려한 amount 예)100개=100e18]
    ```
- `npx hardhat call [vesting contract] Vesting prepare [distributor] [beneficiary] [amount] [initialUnlocked] [unlockPeriodHours] [duration] [token]`
- 옵션 설명
  - [vesting contract]: vesting 컨트랙트를 지정합니다.
  - [distributor]: 토큰을 분배하는 계정의 주소를 지정합니다.
  - [beneficiary]: 베스팅 수혜자를 설정합니다.
  - [amount]: 베스팅 물량을 설정합니다. decimals는 생략합니다.
  - [initialUnlocked] 초기 unlock 물량을 설정합니다. (amount - initial) 만큼의 물량이 lock된 채 시작합니다. decimals는 생략합니다.
  - [unlockPeriodHours]: 베스팅 unlock 단위 시간을 설정합니다. 이 시간마다 일정 물량이 unlock이 됩니다. 기본값은 730이고, 단위는 시간입니다.
  - [duration]: 베스팅 총 기간을 설정합니다. period 기간을 총 몇 번 할지 설정합니다. 기본값은 36입니다. (730시간 * 36 = 3년)
  - [token]: 베스팅할 토큰을 지정합니다.
```
ex)
npx hardhat call 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c Vesting prepare 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D 0xc4417F73DaC656337cEcfee8c784130f08be4FA7 1000 0 730 36 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 --network baseSepolia
=== INPUT ===
signer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
address: 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c
contract: Vesting
function: prepare
args: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D,0xc4417F73DaC656337cEcfee8c784130f08be4FA7,1000,0,730,36,0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
estimateGas: false
block: undefined
chunking: undefined
chunkingLimit: 200
=============

{
  "transactionHash": "0xd3efb71e8c1a2f913dba067f141a9ffe967616dc4659d5a7abaf4dabc5b6e3f9",
  "blockNumber": 1,
  "blockHash": "0x5afdcd95b54690822e9c2d82aa9f70b62da174d69b24d765ed90eab3577b4901",
  "transactionIndex": 0,
  "from": "0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D",
  "to": "0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c",
  "gasUsed": "22740",
  "cumulativeGasUsed": "22740",
  "effectiveGasPrice": "1250000000",
  "status": 1
}

```

## `Vesting Contract` Setstart 하기
- 베스팅 시작 시각을 설정합니다.
- 이 작업을 수행하기 전에 반드시 prepared 상태여야 합니다. (Prepare를 먼저 수행해야 함)
- 현재 시각이 설정한 start 시각이 되면, 베스팅을 시작합니다. 설정한 start 시각 + 730시간이 지나면 첫 토큰이 unlock됩니다.
- `npx hardhat call [vesting contract] Vesting setStart [start]`
- 옵션 설명
  - [vesting contract]: vesting 컨트랙트를 지정합니다.
  - [start]: start 시각을 지정합니다. 다음 포맷의 지원합니다.
    - timestamp 값: e.g.) 1706745600
    - ISO 8601 date time 포맷
       - e.g.
       - 2024-07-17
       - 2024-07-17T09:00:00
       - 2024-07-17T09:00:00+09:00
       - 2024-W29-3

```
npx hardhat call [vesting contract] Vesting setStart [start]

ex)
npx hardhat call 0x3fd5e8e8E9D632B3431B3107528FD2AeAa91A05c Vesting setStart 2024-07-17T09:00:00 --network baseSepolia
```

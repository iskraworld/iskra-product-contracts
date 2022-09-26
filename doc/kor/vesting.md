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
git clone https://github.com/iskraworld/iskra-console-cmd.git
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
- `--signer`, `--password` 옵션을 주면 hardhat config에 설정된 계정이 아닌, 지정한 계정으로 배포를 수행합니다. 사전에 wallet을 생성해야 가능합니다.
- hardhat node가 아닌 외부 블록체인(baobab, ethereum, goerli)에 배포하려면 기본 계정에 base coin(Klay 또는 Ether 등)이 준비되어 있어야 합니다.
- 별도의 지갑으로 배포하거나 트랜잭션을 수행하려면 지갑을 미리 준비하시고 `--signer` 옵션을 사용하시기 바랍니다.

```
npx hardhat wallet:add --name [name] --password [password]

ex)
npx hardhat wallet:add --name deployer --password 1234
wallet [deployer] is added

npx hardhat vesting:deploy_impl --signer deployer --password 1234
```
- 보다 자세한 wallet 이용법은 [Wallet](wallet.md)를 참조하세요.

## 네트워크 선택
- 모든 커맨드에 네트워크 옵션(`--network`)을 줄 수 있습니다. 네트워크 옵션을 주지 않으면 hardhat node(local)에서 수행됩니다.
- 네트워크 설정은 `harhat.config.js`에 있습니다. 기본적으로 다음 네트워크를 지원합니다. 필요시 네트워크 정보를 추가하시기 바랍니다.
  - `baobab`: Klaytn testnet
  - `cypress`: Klaytn mainnet
  - `goerli`: Ethereum testnet
  - `ethereum`: Ethereum mainnet
- 예로 Baobab에서 수행하려면 아래처럼 옵션을 주면 됩니다.

```
npx hardhat vesting:deploy_impl --network baobab
```
- [주의] hardhat node는 매번 수행될 때마다 체인이 리셋(초기화) 됩니다. 따라서 커맨드 실행과 실행 사이에 연속성이 없기 때문에 배포한 컨트랙트를 새로운 커맨드로 실행할 수가 없습니다.

## `Vesting Implementation`, `Vesting Beacon` 배포하기
- 이 컨트랙트들은 한 번만 배포하면 됩니다.
- 스크립트를 실행하면 `Vesting Implementation`, `Vesting Beacon`가 한 번에 배포됩니다.
- 다음 옵션을 지원합니다.
  - `--network`(optional): 네트워크를 선택합니다. 사용가능 값: `[baobab, cypress, goerli, ethereum]`
  - `--signer`(optional): 트랜잭션을 수행할 지갑을 설정합니다. 생략하면 hardhat.config에 설정된 기본 계정을 사용합니다.
  - `--password`(optional): 트랜잭션을 수행할 지갑의 암호를 입력합니다.

```
npx hardhat vesting:deploy_impl [--signer [signer] --password [password]]

ex)
npx hardhat vesting:deploy_impl --network baobab  
============Args================
{ signer: undefined, password: undefined }
================================
============TxResult============
Tx Success
[
  {
    transactionIndex: 1,
    blockNumber: 102257549,
    transactionHash: '0x8c25590a897273c484ad8994b7bc427de840206c562fe28565a1bbebb70e44e6',
    address: '0xbacB89A2B7a9333C1C69D30f76c5176cC8BfA6d8',
    topics: [
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7'
    ],
    data: '0x',
    logIndex: 0,
    blockHash: '0x184e53f2f9d901b8ad4dd24358d02b6390c12073ba4e21fe9988119ae869d572'
  }
]
================================
 > Vesting implementation contract was deployed to: 0x1e89940dbD4A278dB2e7dE2f86B8F673bc68D042
 > Vesting beacon contract was deployed to: 0xbacB89A2B7a9333C1C69D30f76c5176cC8BfA6d8
```
- 스크립트가 성공적으로 배포를 하면 위와 같이 두 컨트랙트 주소가 출력됩니다.
- 또한 `~/.iskra-console/deployed/vesting-impl-address.json` 파일에 컨트랙트 주소가 남겨집니다.
- 배포할 때마다 이 정보는 파일에 over write 합니다.

## `Vesting Proxy` 배포하기
- 이 컨트랙트는 수혜자(beneficiary)별로 배포되어야 합니다.
- 각 베스팅의 상태 정보들을 갖고 있고, 각 수혜자는 이 컨트랙트를 바라보게 됩니다.
- 실제 배분되는 토큰을 소유하고 있는 컨트랙트입니다.
- 다음 단계를 거칩니다.
  - initialized: 배포된 초기 상태. 컨트랙트 owner가 정해집니다.
  - prepared: 수혜자(beneficiary), 물량, 토큰, 베스팅 기간을 설정(prepare)하면 prepared 상태가 됩니다. owner만 수행할 수 있습니다.
  - setstart: 시작 시각을 설정합니다.
  - started: 시작 시각이 지나면 started 상태가 되고, 시간이 카운팅됩니다. 이 후부터 매 730시간마다 일정 물량이 unlock됩니다.
- 다음 옵션을 지원합니다.
  - `--network`(optional): 네트워크를 선택합니다. 사용가능 값: `[baobab, cypress, goerli, ethereum]`
  - `--signer`(optional): 트랜잭션을 수행할 지갑을 설정합니다. 생략하면 hardhat.config에 설정된 기본 계정을 사용합니다.
  - `--password`(optional): 트랜잭션을 수행할 지갑의 암호를 입력합니다.
  - `--beacon`(optional): 기 배포된 beacon 컨트랙트를 지정합니다. 생략시 `~/.iskra-console/deployed/vesting-impl-address.json`의 beacon 주소를 사용합니다.
- 배포는 다음 커맨드로 실행합니다.

```
npx hardhat vesting:deploy [--signer [signer] --password [password]] [--beacon [beacon address]]

ex)
npx hardhat vesting:deploy --network baobab
============Args================
{ signer: undefined, password: undefined, beacon: '' }
================================
 > Vesting proxy deployed to: 0x1A61b1cbe03aC8f6Fd8648de04C5b30bb85E38a0
```

- `--beacon` 옵션으로 `Vesting Beacon` 컨트랙트 주소를 줄 수 있습니다. 생략하면 `.iskra-console/deployed/vesting-impl-address.json`의 값을 사용합니다.
- 성공적으로 실행되면 `~/.iskra-console/deployed/vesting-address.json`에 생성된 컨트랙트 주소가 기록됩니다.
- 배포가 되면 `initialized` 상태가 됩니다.
- 이후 컨트랙트 owner(배포자)는 `Prepare`를 수행할 수 있습니다.

## `Vesting Proxy` Prepare 하기
- 배포된 초기 상태의 `Vesting Proxy`에 다음 정보를 세팅하는 작업을 `Prepare`라고 합니다.
  - `beneficiary`: 베스팅 수혜자
  - `amount`: 베스팅 물량
  - `initial`: 최초 unlock 상태로 배포할 물량
  - `token`: 베스팅 받을 토큰
  - `duration`: 베스팅 기간. 단위는 730 시간. 생략하면 36 개월(1 개월은 730 시간을 단위로 함)
- 이 작업을 수행할 때, owner가 가지고 있는 token의 amount 만큼의 수량이 `Vesting Proxy`로 옮겨집니다.
- 따라서 이 작업을 수행하기 전에 먼저 해당 토큰의 `approve`를 먼저 수행해야 합니다.
- 다음 옵션을 지원합니다.
  - `--network`(optional): 네트워크를 선택합니다. 사용가능 값: `[baobab, cypress, goerli, ethereum]`
  - `--signer`(optional): 트랜잭션을 수행할 지갑을 설정합니다. 생략하면 hardhat.config에 설정된 기본 계정을 사용합니다.
  - `--password`(optional): 트랜잭션을 수행할 지갑의 암호를 입력합니다.
  - `--beneficiary`: 베스팅 수혜자를 설정합니다.
  - `--amount`: 베스팅 물량을 설정합니다.
  - `--initial`(optional): 초기 unlock 물량을 설정합니다. amount-initial 만큼의 물량이 lock된 채 시작합니다.
  - `--vesting`(optional): vesting proxy 컨트랙트를 지정합니다. 생략시 `~/.iskra-console/deployed/vesting-address.json`의 값을 사용합니다.
  - `--token`(optional): 베스팅할 토큰을 지정합니다. 생략시 `~/.iskra-console/deployed/gametoken-address.json`의 값을 사용합니다.
  - `--duration`(optional): 베스팅 총 기간을 설정합니다. 730시간 단위입니다. 생략시 기본값 36을 사용합니다.
  
```
npx hardhat gametoken:approve [--signer [signer] --password [password]] --spender [vesting proxy contract address] --amount [amount] [--token [game token address]]
npx hardhat vesting:prepare [--signer [signer] --password [password]] --beneficiary [a beneficiary address] --amount [amount] [--initial [initial unlocked amount]] [--vesting [vesting proxy]] [--token [game token]] [--duration [duration]]

ex)
npx hardhat --network baobab gametoken:approve --spender 0x1A61b1cbe03aC8f6Fd8648de04C5b30bb85E38a0 --amount 1000
============Args================
{
  spender: '0x1A61b1cbe03aC8f6Fd8648de04C5b30bb85E38a0',
  amount: '1000',
  signer: undefined,
  password: undefined,
  token: ''
}
================================
============TxResult============
Tx Success
[
  {
    transactionIndex: 0,
    blockNumber: 102258695,
    transactionHash: '0xeebb1f5c11e3a68267ac6b559102762c64b075cd946c6951063d486e63fcae8a',
    address: '0xCf723d52d2b121d829209109903F7BF823F3a5C8',
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7',
      '0x0000000000000000000000001a61b1cbe03ac8f6fd8648de04c5b30bb85e38a0'
    ],
    data: '0x00000000000000000000000000000000000000000000003635c9adc5dea00000',
    logIndex: 0,
    blockHash: '0x2a900d4c105e66fae3c74408292b8908d30eb71f85fe119066cf4b3c00645eba'
  }
]
================================

npx hardhat --network baobab vesting:prepare --beneficiary 0xc4417F73DaC656337cEcfee8c784130f08be4FA7 --amount 1000
============Args================
{
  beneficiary: '0xc4417F73DaC656337cEcfee8c784130f08be4FA7',
  amount: '1000',
  signer: undefined,
  password: undefined,
  initial: '0',
  vesting: '',
  token: '',
  duration: '36'
}
================================
============TxResult============
Tx Success
[
  {
    transactionIndex: 1,
    blockNumber: 102259532,
    transactionHash: '0xdd587ed4a2b5c703e0fb3f6f70798897248eb4e9608cc2e17169ca4cfe706e4a',
    address: '0xCf723d52d2b121d829209109903F7BF823F3a5C8',
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7',
      '0x0000000000000000000000001a61b1cbe03ac8f6fd8648de04c5b30bb85e38a0'
    ],
    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
    logIndex: 0,
    blockHash: '0xa2eab4384cf312ea9baa4c8776466fde39d48ec41050ea602464a82680ad5025'
  },
  {
    transactionIndex: 1,
    blockNumber: 102259532,
    transactionHash: '0xdd587ed4a2b5c703e0fb3f6f70798897248eb4e9608cc2e17169ca4cfe706e4a',
    address: '0xCf723d52d2b121d829209109903F7BF823F3a5C8',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7',
      '0x0000000000000000000000001a61b1cbe03ac8f6fd8648de04c5b30bb85e38a0'
    ],
    data: '0x00000000000000000000000000000000000000000000003635c9adc5dea00000',
    logIndex: 1,
    blockHash: '0xa2eab4384cf312ea9baa4c8776466fde39d48ec41050ea602464a82680ad5025'
  },
  {
    transactionIndex: 1,
    blockNumber: 102259532,
    transactionHash: '0xdd587ed4a2b5c703e0fb3f6f70798897248eb4e9608cc2e17169ca4cfe706e4a',
    address: '0x1A61b1cbe03aC8f6Fd8648de04C5b30bb85E38a0',
    topics: [
      '0xe7bccab453c765aae044d5529a9a9427423ee6ed52f9ea89fd572a84b707d784'
    ],
    data: '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024000000000000000000000000cf723d52d2b121d829209109903f7bf823f3a5c8',
    logIndex: 2,
    blockHash: '0xa2eab4384cf312ea9baa4c8776466fde39d48ec41050ea602464a82680ad5025'
  }
]
================================
```

## `Vesting Proxy` Setstart 하기
- 베스팅 시작 시각을 설정합니다.
- 이 작업을 수행하기 전에 반드시 prepared 상태여야 합니다. (Prepare를 먼저 수행해야 함)
- 현재 시각이 설정한 start 시각이 되면, 베스팅을 시작합니다. 설정한 start 시각 + 730시간이 지나면 첫 토큰이 unlock됩니다.
- 다음 옵션을 지원합니다.
  - `--network`(optional): 네트워크를 선택합니다. 사용가능 값: `[baobab, cypress, goerli, ethereum]`
  - `--signer`(optional): 트랜잭션을 수행할 지갑을 설정합니다. 생략하면 hardhat.config에 설정된 기본 계정을 사용합니다.
  - `--password`(optional): 트랜잭션을 수행할 지갑의 암호를 입력합니다.
  - `--vesting`(optional): vesting proxy 컨트랙트를 지정합니다. 생략시 `~/.iskra-console/deployed/vesting-address.json`의 값을 사용합니다.
  - `--start`: start 시각을 지정합니다. `yyyy-mm-dd hh:mm:ss` 포멧으로 값을 주어야 하고, 로컬 타임존 기준의 시각을 입력합니다.

```
npx hardhat vesting:setstart [--signer [signer] --password [password]] --start [start time] [--vesting [vesting proxy]]

ex)
npx hardhat --network baobab vesting:setstart --start "2022-05-01 09:00:00"
```

## `Vesing Proxy` 한 번에 세팅하기
- `Vesting Proxy` 컨트랙트의 배포, prepare, setstart를 한 번에 수행할 수 있습니다.
- 다음 옵션을 지원합니다.
  - `--network`(optional): 네트워크를 선택합니다. 사용가능 값: `[baobab, cypress, goerli, ethereum]`
  - `--signer`(optional): 트랜잭션을 수행할 지갑을 설정합니다. 생략하면 hardhat.config에 설정된 기본 계정을 사용합니다.
  - `--password`(optional): 트랜잭션을 수행할 지갑의 암호를 입력합니다.
  - `--beneficiary`: 베스팅 수혜자를 설정합니다.
  - `--amount`: 베스팅 물량을 설정합니다.
  - `--start`: start 시각을 지정합니다. `yyyy-mm-dd hh:mm:ss` 포멧으로 값을 주어야 하고, 로컬 타임존 기준의 시각을 입력합니다.  - `--initial`(optional): 초기 unlock 물량을 설정합니다. amount-initial 만큼의 물량이 lock된 채 시작합니다.
  - `--token`(optional): 베스팅할 토큰을 지정합니다. 생략시 `~/.iskra-console/deployed/gametoken-address.json`의 값을 사용합니다.
  - `--duration`(optional): 베스팅 총 기간을 설정합니다. 730시간 단위입니다. 생략시 기본값 36을 사용합니다.
  - `--beacon`(optional): 기 배포된 beacon 컨트랙트를 지정합니다. 생략시 `~/.iskra-console/deployed/vesting-impl-address.json`의 beacon 주소를 사용합니다.

```
ex) 
npx hardhat --network baobab vesting:one_stop_setup --beneficiary 0xc4417F73DaC656337cEcfee8c784130f08be4FA7 --amount 10000 --start "2022-02-01 23:00:00" --duration 12
============Args================
{
  beneficiary: '0xc4417F73DaC656337cEcfee8c784130f08be4FA7',
  amount: '10000',
  start: '2022-02-01 23:00:00',
  duration: '12',
  signer: undefined,
  password: undefined,
  initial: '0',
  beacon: '',
  token: ''
}
================================
 > Vesting proxy deployed to: 0x5cC42091bdF5603faE0094b7032460aF0a63dC1F
============TxResult============
Tx Success
[
  {
    transactionIndex: 0,
    blockNumber: 102327586,
    transactionHash: '0xab9554848bbc0d28e9c138a46a03a2ef956552f48358c094316ad6ead1329110',
    address: '0xCf723d52d2b121d829209109903F7BF823F3a5C8',
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7',
      '0x0000000000000000000000005cc42091bdf5603fae0094b7032460af0a63dc1f'
    ],
    data: '0x00000000000000000000000000000000000000000000021e19e0c9bab2400000',
    logIndex: 0,
    blockHash: '0x7b98bf6d5f0a9cb589e319cd7632c9fd9d49895a288c8d438a0ad172ac50666f'
  }
]
================================
============TxResult============
Tx Success
[
  {
    transactionIndex: 2,
    blockNumber: 102327590,
    transactionHash: '0x3f068eaddc242a98db431819507bce6a922a2135452aaddd141590f6f3e7a625',
    address: '0xCf723d52d2b121d829209109903F7BF823F3a5C8',
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7',
      '0x0000000000000000000000005cc42091bdf5603fae0094b7032460af0a63dc1f'
    ],
    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
    logIndex: 0,
    blockHash: '0xc860a364aff78c8a8b83903fc8902871ede74235ae7439f4fde8df9165171a65'
  },
  {
    transactionIndex: 2,
    blockNumber: 102327590,
    transactionHash: '0x3f068eaddc242a98db431819507bce6a922a2135452aaddd141590f6f3e7a625',
    address: '0xCf723d52d2b121d829209109903F7BF823F3a5C8',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7',
      '0x0000000000000000000000005cc42091bdf5603fae0094b7032460af0a63dc1f'
    ],
    data: '0x00000000000000000000000000000000000000000000021e19e0c9bab2400000',
    logIndex: 1,
    blockHash: '0xc860a364aff78c8a8b83903fc8902871ede74235ae7439f4fde8df9165171a65'
  },
  {
    transactionIndex: 2,
    blockNumber: 102327590,
    transactionHash: '0x3f068eaddc242a98db431819507bce6a922a2135452aaddd141590f6f3e7a625',
    address: '0x5cC42091bdF5603faE0094b7032460aF0a63dC1F',
    topics: [
      '0xe7bccab453c765aae044d5529a9a9427423ee6ed52f9ea89fd572a84b707d784'
    ],
    data: '0x000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7000000000000000000000000c4417f73dac656337cecfee8c784130f08be4fa7000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000cf723d52d2b121d829209109903f7bf823f3a5c8',
    logIndex: 2,
    blockHash: '0xc860a364aff78c8a8b83903fc8902871ede74235ae7439f4fde8df9165171a65'
  }
]
================================
============TxResult============
Tx Success
[
  {
    transactionIndex: 0,
    blockNumber: 102327594,
    transactionHash: '0x6771c7e7e714c948e93c17f19292291c91a1a01ad573c89eb467d29a528f62a8',
    address: '0x5cC42091bdF5603faE0094b7032460aF0a63dC1F',
    topics: [
      '0xa90eb1b95730847a8accda482028369bf1adf121f830e5fcd90aa769d25dbb22'
    ],
    data: '0x0000000000000000000000000000000000000000000000000000000061f93ce0',
    logIndex: 0,
    blockHash: '0xc532611f242f643b388746117776c49164fc9520657d246ae31ef390f734b351'
  }
]
================================
 > Vesting contract was prepared successfully

```
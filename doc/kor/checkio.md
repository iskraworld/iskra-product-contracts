# Check IO

## 개요
- 싱크모듈과 인터랙션하는 task의 모음입니다.

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

## 체크인하기
- 사용 커맨드: `checkio:checkin`
- 특정 버켓에 체크인합니다.
- ERC20 approve 와 checkIn 두 TX를 보냅니다.
- 다음 옵션을 지원합니다.
  - `--network`(optional): 네트워크를 선택합니다. 사용가능 값: `[baobab, cypress, goerli, ethereum]`
  - `--signer`(optional): 트랜잭션을 수행할 지갑을 설정합니다. 생략하면 hardhat.config에 설정된 기본 계정을 사용합니다.
  - `--password`(optional): 트랜잭션을 수행할 지갑의 암호를 입력합니다.
  - `--checkio`(required): 인터랙션할 체크인 컨트랙트의 주소입니다.
  - `--token`(required): 체크인할 토큰의 주소입니다.
  - `--bucket-id`(required): 체크인할 버켓의 ID입니다.
  - `--amount`(required): 체크인할 토큰의 수량입니다. (옵션의 단위는 1=10^18개 입니다.)
  - `--data`(optional): 체크인하면서 추가할 데이터입니다. hex string 입니다.

```
npx hardhat checkio:checkin [--signer [signer] --password [password]] --checkio [checkio] --token [token] --bucket-id [bucketId] --amount [amount]

ex)
hardhat checkio:checkin --checkio 0x47046F408F54704BBF0d60ED91b40711507a2A71 --token 0x2216ba99b517B20507c5118e560443f2673D48eA --bucket-id 0 --amount 10 --network baobab  
```

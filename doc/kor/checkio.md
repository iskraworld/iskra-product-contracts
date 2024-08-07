# Check IO

## 개요
- 싱크모듈과 인터랙션하는 task의 모음입니다.

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

## 체크인하기
- 특정 버켓에 체크인합니다.
- 사전에 토큰의 approve 를 하여야 합니다.
  - npx hardhat call [token address] IERC20 approve [checkio] [amount; decimals 고려한 수량]
  - ```
    e.g.)
    npx hardhat call 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D IERC20 approve 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 100e18 --network baseSepolia
    ```
- 체크인 실행
```
npx hardhat call [checkio] FTCheckIO "checkIn(address,uint8,address,uint256,bytes)" [token] [bucketId] [account] [amount] [data]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 FTCheckIO "checkIn(address,uint8,address,uint256,bytes)" 0x2216ba99b517B20507c5118e560443f2673D48eA 0 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D 10e18 0x --network baseSepolia
```

- 옵션 설명
  - `[checkio]`(required): 인터랙션할 체크인 컨트랙트의 주소입니다.
  - `[token]`(required): 체크인할 토큰의 주소입니다.
  - `[bucketId]`(required): 체크인할 버켓의 ID입니다.
  - `[account]`(required): 체크인할 계정의 주소입니다.
  - `[amount]`(required): 체크인할 토큰의 수량입니다. (decimals를 고려해야 합니다. 예제에서는 `e18` 을 추가하여 decimals 18에 맞추었습니다.)
  - `[data]`(required): 체크인하면서 추가할 데이터입니다. hex string 입니다. `0x` 를 입력하면 빈 데이터를 의미합니다.

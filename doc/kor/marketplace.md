# MarketPlace

## 개요
- MarketPlace와 인터랙션하는 task의 모음입니다.

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

## Mystery Card 등록
- Mystery Card를 등록합니다.
- 사전에 토큰의 approve 를 하여야 합니다.
  - npx hardhat call [token address] IERC721 setApprovalForAll [marketplace] [approved]
  - ```
    e.g.)
    npx hardhat call 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D IERC721 setApprovalForAll 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 true --network baseSepolia
    ```
- 등록 실행
```
npx hardhat call [marketplace] MarketPlace registerCardMystery "[[nft],[cardId],[price],[startTime],[endTime],[purchaseChecker]]" [startTokenId] [endTokenId] [tokenHolder] [purchaseLimit]

ex)
npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 MarketPlace registerCardMystery \
  "[0x507668B352BeAc83aA0572E62D2458a8dF2FcAfF,1,1e18,0,0,0x0000000000000000000000000000000000000000]"  1 2229 0xd85EFF20288ca72eA9eEcFFb428F89EE5066CA5C 0 \
  --network baseSepolia
```

- 옵션 설명
  - `[marketplace]`(required): 인터랙션할 market place 컨트랙트의 주소입니다.
  - `[nft]`(required): 등록할 NFT 컨트랙트의 주소입니다.
  - `[cardId]`(required): 등록할 card id 입니다.
  - `[price]`(required): 가격입니다. deciamls 를 고려하여야 합니다. 예) 1e18=1, 1e17=0.1
  - `[startTime]`(required): 판매시작 timestamp 입니다.
  - `[endTime]`(required): 판매종료 timestamp 입니다.
  - `[purchaseChecker]`(required): checker address 입니다.
  - `[startTokenId]`(required): 판매할 토큰 Range의 Start ID 입니다.
  - `[endTokenId]`(required): 판매할 토큰 Range의 End ID 입니다.
  - `[tokenHolder]`(required): NFT 홀더 주소입니다.
  - `[purchaseLimit]`(required): 사용자당 구매가능 수량입니다. 0 이면 무제한.

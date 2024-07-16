# ISKRA Item NFT(ERC721) Contract

## 개요
- `contracts/token/ERC721/ItemNFT.sol` 파일은 ERC721 표준을 따르는 샘플 대체불가 토큰 구현체로서, mint/burn 기능을 갖춘 대체불가 토큰입니다.
- `contracts/token/ERC721/ItemNFTSnapshot.sol` ItemNFT 에 특점 시점의 NFT owner와 NFT balance의 Snapshot을 제공하도록 확장한 토큰입니다.
- 컨트랙트 배포 시에만 burn 가능 여부를 설정할 수 있으며 배포 후에는 변경할 수 없습니다.

## 권한
- OWNER, BURNER 역할이 정의되어 있으며, 초기 배포자는 이 모든 권한을 유일하게 가집니다.
- OWNER 권한은 mint, burn, setURI, setBaseURI을 수행 할 수 있으며, BURNER를 정의할 수 있습니다.
- BURNER 권한은 토큰을 burn할 수 있습니다.

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
```
npx hardhat deploy [ItemNFT | ItemNFTSnapshot] [name] [symbol] [uri] [burnable]

e.g.
npx hardhat deploy ItemNFTSnapshot "Item  NFT" IN "https://metadata.url/" true --network baseSepolia
=== INPUT ===
deployer: 0x9f7f9a6D9bd84E764a2705211b73CaD811CE357D
contract: ItemNFTSnapshot
args: Item  NFT,IN,https://metadata.url/,true
=============

contract address: 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0
```
- [ItemNFT | ItemNFTSnapshot]: Snapshot 확장 기능 여부를 선택합니다.
- [name], [symbol], [uri], [burnable] 은 필수 입니다.

## mint
- npx hardhat call [token address] ItemNFT mint [to] [tokenId]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT safeMint 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 100 --network baseSepolia`
- 다중 token id를 수행하려면 아래의 `safeMintBatch` 명령어를 사용합니다.
  - npx hardhat call [token address] ItemNFT safeMintBatch [to] [tokenIds]
  - comma separated ids로 tokenID를 지정합니다.
    - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT safeMintBatch 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 "[100,200,300,400]" --network baseSepolia`
  - range로 tokenID를 지정합니다.
      - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT safeMintBatch 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 "[1..100]" --network baseSepolia`

## burn
- BURN 권한이 있는 signer가 소유한 토큰만 burn 할 수 있습니다.
- npx hardhat call [token address] ItemNFT burn [tokenId]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT burn 100 --network baseSepolia`

## transfer
- npx hardhat call [token address] ItemNFT transferFrom [from] [to] [id]
- npx hardhat itemnft:safetransferfrom --signer [signer] --password [password] --from [from] --to [to] --id [id] --network [network]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT transferFrom 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 100 --network baseSepolia`

## uri
- npx hardhat call [token address] ItemNFT setBaseURI [uri]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT setBaseURI 'IT IS SAMPLE BASE URI' --network baseSepolia`
- npx hardhat call [token address] ItemNFT setTokenURI [id] [uri]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT setTokenURI 1 'IT IS SAMPLE BASE URI' --network baseSepolia`

## approval
- npx hardhat call [token address] ItemNFT setApprovalForAll [operator] [approved]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT setApprovalForAll 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 true --network baseSepolia`

## access control
- npx hardhat call [token address] ItemNFT setBurnApproval [burner] [approved]
  - `npx hardhat call 0x525d7E8b856f59dFD84ebE58241302BDc40B0ee0 ItemNFT setBurnApproval 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 true --network baseSepolia`
  - account에게 burn permission을 부여/박탈 합니다.

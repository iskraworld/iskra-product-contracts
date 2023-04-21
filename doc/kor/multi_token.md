# ISKRA Multi Token(ERC1155) Contract

## 개요
- `contracts/token/ERC1155/MultiToken.sol` 파일은 ERC1155 표준을 따르는 샘플 멀티 토큰 구현체로서, mint/burn/pause 기능을 갖춘 멀티 토큰입니다.
- 컨트랙트 자체엔 NFT(Non-fungible token)/FT(Fungible token)의 구분이 따로 없으며, 임의의 tokenID로 토큰을 생성할 수 있습니다.
- 다만, command 스크립트에서는 supply가 1인 토큰을 NFT로 간주하여 추가 mint가 불가능하도록 되어 있습니다.

## 권한
- OWNER, URI_SETTER, MINTER, PAUSER 네 가지 역할(role)이 정의되어 있으며, 초기 배포자는 이 모든 권한을 유일하게 가집니다.
- OWNER 권한은 URI_SETTER, MINTER, PAUSER를 정의할 수 있습니다.
- URI_SETTER 권한은 토큰의 uri 정보를 바꿀 수 있습니다.
- MINTER 권한은 토큰을 mint할 수 있습니다.
- PAUSER 권한은 토큰을 pause할 수 있습니다.

## 빌드
소스 코드를 다운 받습니다. npm, git 등은 설치되어 있다고 가정합니다.
```
git clone https://github.com/iskraworld/iskra-product-cmd.git
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

npx hardhat multitoken:deploy --signer deployer --password 1234
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
npx hardhat multitoken:deploy --network baobab
```
- [주의] hardhat node는 매번 수행될 때마다 체인이 리셋(초기화) 됩니다. 따라서 커맨드 실행과 실행 사이에 연속성이 없기 때문에 배포한 컨트랙트를 새로운 커맨드로 실행할 수가 없습니다.

## 배포
- npx hardhat multitoken:deploy [--signer [signer] --password [password]] [--uri [uri]] --network [network]
  - `npx hardhat multitoken:deploy --network baobab`
  - uri은 optional 입니다.
  - Iskra Multi Token을 uri와 함께 deploy 합니다.
  - `~/.iskra-console/deployed/multitoken_address.json` 파일에 배포된 컨트랙트의 주소를 저장합니다.
  - 나머지 커맨드 들은 `--contract` 옵션으로 오버라이드 하지 않는다면, 기본적으로 이 주소로 호출합니다.

## mint
- totalSupply(id)를 조회하여 1 이었으면 non fungible token 으로 간주하고 mint 하지 않습니다.
- npx hardhat multitoken:mint --signer [signer] --password [password] --id [id] --to [to] --amount [amount] --network [network]
  - `npx hardhat multitoken:mint --to f39fd6e51aad88f6f4ce6ab8827279cfffb92266 --id 0 --amount 100 --network baobab`
- npx hardhat multitoken:mint-batch --signer [signer] --password [password] --id [id](,id, …) --to [to] --amount [amount](,amount, …) --network [network]
  - `npx hardhat multitoken:mint-batch --to f39fd6e51aad88f6f4ce6ab8827279cfffb92266 --ids 1,2,3,0x8000000000000000000000000000000000000000000000000000000000000000 --amounts 1,2,3,1 --network baobab`

## burn
- totalSupply(id)를 조회하여 2 이상 이었으면 fungible token 으로 간주하여, burn 후 totalSupply가 1이 된다면 burn을 하지 않습니다. 
- npx hardhat multitoken:burn --signer [signer] --password [password] --id [id] --from [from] --amount [amount]
  - `npx hardhat multitoken:burn --from 70997970c51812dc3a010c7d01b50e0d17dc79c8 --id 0 --amount 100 --network baobab --signer account2 --password 1234`
- npx hardhat multitoken:burn-batch --signer [signer] --password [password] --from [from] --id [id](,id, …) --amount [amount](,amount, …) --network [network]
  - `npx hardhat multitoken:burn-batch --from 70997970c51812dc3a010c7d01b50e0d17dc79c8 --ids 1,2,3,0x8000000000000000000000000000000000000000000000000000000000000000 --amounts 1,2,3,1 --network baobab --signer account2 --password 1234`

## transfer
- npx hardhat multitoken:safetransferfrom --signer [signer] --password [password] --from [from] --to [to] --id [id] --amount [amount] --network [network]
  - `npx hardhat multitoken:safetransferfrom --from f39fd6e51aad88f6f4ce6ab8827279cfffb92266 --to 70997970c51812dc3a010c7d01b50e0d17dc79c8 --id 0 --amount 100 --network baobab`
- npx hardhat multitoken:safetransferfrom-batch -signer [signer] --password [password] --from [from] --to [to] --id [id](,id, …) --amount [amount](,amount, …) --network [network]
  - `npx hardhat multitoken:safetransferfrom-batch --from f39fd6e51aad88f6f4ce6ab8827279cfffb92266 --to 70997970c51812dc3a010c7d01b50e0d17dc79c8 --ids 1,2,3,0x8000000000000000000000000000000000000000000000000000000000000000 --amounts 1,2,3,1 --network baobab`

## uri
- npx hardhat multitoken:seturi --signer [signer] --password [password] --id [id] --uri [uri] --network [network]
  - `npx hardhat multitoken:seturi --id 1 --uri 'IT IS SAMPLE URI' --network baobab`

## approval
- npx hardhat multitoken:setapprovalforall --signer [signer] --password [password] --operator [operator] --approved [true/false] --network [network]
  - `npx hardhat multitoken:setapprovalforall --operator 70997970c51812dc3a010c7d01b50e0d17dc79c8 --approved true --network baobab`

## access control
- npx hardhat multitoken:grantrole --signer [signer] --password [password] --account [account] --role [role] --network [network]
  - `npx hardhat multitoken:grantrole --account 70997970c51812dc3a010c7d01b50e0d17dc79c8 --role URI_SETTER_ROLE --network baobab`
  - account에게 role을 부여합니다.
- npx hardhat multitoken:revokerole --signer [signer] --password [password] --account [account] --role [role] --network [network]
  - `npx hardhat multitoken:revokerole --account f39fd6e51aad88f6f4ce6ab8827279cfffb92266 --role URI_SETTER_ROLE --network baobab`
  - account로부터 role을 박탈합니다.

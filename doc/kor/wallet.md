# ISKRA Contract 작업을 위한 Wallet 사용 방법

## 개요
- ISKRA Contract(GameTokem, MultiToken, Vesting)을 배포하거나 운영하기 위해서는 블록체인 지갑이 필요합니다.
- wallet command 툴을 통해서 지갑을 생성, 관리할 수 있습니다.
- wallet comaand에는 다음 명령어들이 포함됩니다.
  - `wallet:add`
  - `wallet:import`
  - `wallet:delete`
  - `wallet:list`
  - `wallet:show`

## `wallet:add`
- npx hardhat wallet:add [name] [--password [password]]
  - `npx hardhat wallet:add game_owner`
  - 랜덤하게 새로운 account를 생성합니다.
  - password 로 암호화한 encrypted json key 파일을 name 으로 생성하여 wallet 홈에 저장합니다.
  - wallet 홈은 `~/.iskra_console/wallet` 입니다.

## `wallet:import`
- npx hardhat wallet:import [name] [--password [password]] [--privatekey [privatekey]]
  - `npx hardhat wallet:import deployer`
  - privatekey로부터 account를 import 합니다.
  - password로 암호화한 encrypted json key 파일을 name 으로 생성하여 wallet 홈에 저장합니다.

## `wallet:delete`
- npx hardhat wallet:delete [name]
  - `npx hardhat wallet:delete game_owner`
  - 해당 account를 삭제합니다.

## `wallet:list`
- npx hardhat wallet:list
  - `npx hardhat wallet:list`
  - account 목록을 표시합니다.

## `wallet:show`
- npx hardhat wallet:show [name] [--a]
  - `npx hardhat wallet:show --name game_owner --a`
  - name account의 상세사항을 출력합니다.
  - `--a` 옵션이 있다면 account의 address만 출력합니다.

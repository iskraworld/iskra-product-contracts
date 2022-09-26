#!/bin/sh

set -ex
CMD="npx hardhat"
CMD_HOME=${HOME}/.iskra-multitoken
rm -rf ${CMD_HOME}

${CMD} wallet:import --name deployer --privatekey 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --password 123456789
${CMD} wallet:import --name account2 --privatekey 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d --password 123456789
${CMD} wallet:import --name account3 --privatekey 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --password 123456789

npx hardhat compile --force
npx hardhat node &
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

sleep 5

CMD_MULTITOKEN=${CMD}" multitoken"

NETWORK="localhost"
DEPLOYER=$(npx hardhat wallet:show --name deployer --a)
ACCOUNT2=$(npx hardhat wallet:show --name account2 --a)
ACCOUNT3=$(npx hardhat wallet:show --name account3 --a)

FTID0=0
FTID1=1
FTID2=2
FTID3=3

NFTID0=0x8000000000000000000000000000000000000000000000000000000000000000

${CMD} wallet:deposit --network ${NETWORK} --to ${DEPLOYER} --amount 10
${CMD} wallet:deposit --network ${NETWORK} --to ${ACCOUNT2} --amount 10
${CMD} wallet:deposit --network ${NETWORK} --to ${ACCOUNT3} --amount 10

${CMD_MULTITOKEN}:deploy --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:mint --to ${DEPLOYER} --id ${FTID0} --amount 100 --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:balanceof --address ${DEPLOYER} --id ${FTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:balanceof-batch --addresses ${DEPLOYER} --ids ${FTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:mint-batch --to ${DEPLOYER} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --amounts 1,2,3,1 --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:balanceof-batch --addresses ${DEPLOYER},${DEPLOYER},${DEPLOYER},${DEPLOYER} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:safetransferfrom --from ${DEPLOYER} --to ${ACCOUNT2} --id ${FTID0} --amount 100 --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:balanceof --address ${DEPLOYER} --id ${FTID0} --network ${NETWORK}
${CMD_MULTITOKEN}:balanceof --address ${ACCOUNT2} --id ${FTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:safetransferfrom-batch --from ${DEPLOYER} --to ${ACCOUNT2} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --amounts 1,2,3,1 --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:balanceof-batch --addresses ${DEPLOYER},${DEPLOYER},${DEPLOYER},${DEPLOYER} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --network ${NETWORK}
${CMD_MULTITOKEN}:balanceof-batch --addresses ${ACCOUNT2},${ACCOUNT2},${ACCOUNT2},${ACCOUNT2} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --network ${NETWORK}


${CMD_MULTITOKEN}:burn --from ${ACCOUNT2} --id ${FTID0} --amount 100 --network ${NETWORK} --signer account2 --password 123456789 

${CMD_MULTITOKEN}:burn-batch --from ${ACCOUNT2} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --amounts 1,2,3,1 --network ${NETWORK} --signer account2 --password 123456789

${CMD_MULTITOKEN}:balanceof-batch --addresses ${ACCOUNT2},${ACCOUNT2},${ACCOUNT2},${ACCOUNT2} --ids ${FTID1},${FTID2},${FTID3},${NFTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:seturi --id ${NFTID0} --uri "IT IS SAMPLE URI" --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:uri --id ${NFTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:mint --to ${DEPLOYER} --id ${FTID0} --amount 100 --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:setapprovalforall --operator ${ACCOUNT2} --approved true --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:isapprovalforall --account ${DEPLOYER} --operator ${ACCOUNT2} --network ${NETWORK}

${CMD_MULTITOKEN}:burn --from ${DEPLOYER} --id ${FTID0} --amount 100 --network ${NETWORK} --signer account2 --password 123456789

${CMD_MULTITOKEN}:setapprovalforall --operator ${ACCOUNT2} --approved false --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:isapprovalforall --account ${DEPLOYER} --operator ${ACCOUNT2} --network ${NETWORK}

${CMD_MULTITOKEN}:totalsupply --id ${FTID0} --network ${NETWORK}
${CMD_MULTITOKEN}:totalsupply --id ${FTID1} --network ${NETWORK}
${CMD_MULTITOKEN}:totalsupply --id ${FTID2} --network ${NETWORK}
${CMD_MULTITOKEN}:totalsupply --id ${FTID3} --network ${NETWORK}
${CMD_MULTITOKEN}:totalsupply --id ${NFTID0} --network ${NETWORK}

${CMD_MULTITOKEN}:exist --id ${FTID0} --network ${NETWORK}
${CMD_MULTITOKEN}:exist --id ${FTID1} --network ${NETWORK}
${CMD_MULTITOKEN}:exist --id ${FTID2} --network ${NETWORK}
${CMD_MULTITOKEN}:exist --id ${FTID3} --network ${NETWORK}
${CMD_MULTITOKEN}:exist --id ${NFTID0} --network ${NETWORK}


${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "DEFAULT_ADMIN_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "URI_SETTER_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "MINTER_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "PAUSER_ROLE" --network ${NETWORK}

${CMD_MULTITOKEN}:hasrole --account ${ACCOUNT2} --role "DEFAULT_ADMIN_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${ACCOUNT2} --role "URI_SETTER_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${ACCOUNT2} --role "MINTER_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${ACCOUNT2} --role "PAUSER_ROLE" --network ${NETWORK}

${CMD_MULTITOKEN}:grantrole --account ${ACCOUNT2} --role "DEFAULT_ADMIN_ROLE" --network ${NETWORK} --signer deployer --password 123456789
${CMD_MULTITOKEN}:grantrole --account ${ACCOUNT2} --role "URI_SETTER_ROLE" --network ${NETWORK} --signer deployer --password 123456789
${CMD_MULTITOKEN}:grantrole --account ${ACCOUNT2} --role "MINTER_ROLE" --network ${NETWORK} --signer deployer --password 123456789
${CMD_MULTITOKEN}:grantrole --account ${ACCOUNT2} --role "PAUSER_ROLE" --network ${NETWORK} --signer deployer --password 123456789

${CMD_MULTITOKEN}:revokerole --account ${DEPLOYER} --role "DEFAULT_ADMIN_ROLE" --network ${NETWORK} --signer account2 --password 123456789
${CMD_MULTITOKEN}:revokerole --account ${DEPLOYER} --role "URI_SETTER_ROLE"   --network ${NETWORK} --signer account2 --password 123456789
${CMD_MULTITOKEN}:revokerole --account ${DEPLOYER} --role "MINTER_ROLE" --network ${NETWORK} --signer account2 --password 123456789
${CMD_MULTITOKEN}:revokerole --account ${DEPLOYER} --role "PAUSER_ROLE" --network ${NETWORK} --signer account2 --password 123456789 

${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "DEFAULT_ADMIN_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "URI_SETTER_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "MINTER_ROLE" --network ${NETWORK}
${CMD_MULTITOKEN}:hasrole --account ${DEPLOYER} --role "PAUSER_ROLE" --network ${NETWORK}


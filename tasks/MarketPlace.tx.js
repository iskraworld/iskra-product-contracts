const { printTxResult, printArguments, walletLoad } = require("./functions");
const MarketPlace = require("../abis-imported/MarketPlace.json");
const { parseEther } = require("@ethersproject/units");

task("mkp:register-card-mystery", "register mystery collection")
  .addOptionalParam(
    "signer",
    "The signer signs this transaction. wallet:add first"
  )
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("market", "market place contract")
  .addParam("nft", "the nft address")
  .addParam("cardId", "the card id")
  .addParam("price", "the token price")
  .addParam("start", "the timestamp of sale start")
  .addParam("end", "the timestamp of sale end")
  .addParam("checker", "the checker address")
  .addParam("startTokenId", "the start token id")
  .addParam("endTokenId", "the end token id")
  .addParam("tokenHolder", "the token holder address")
  .addParam("purchaseLimit", "the amount of nft to be purchase each user")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);

    const price = parseEther(taskArgs.price);

    // const wallet = await walletLoad(taskArgs.signer, taskArgs.password);
    const wallet = await ethers.getSigner(taskArgs.signer);
    const token = await ethers.getContractAt("IERC721", taskArgs.nft, wallet);

    console.log("\nApproving tokens");
    let tx = await token.setApprovalForAll(taskArgs.market, true);
    printTxResult(await tx.wait());

    const mkp = await ethers.getContractAt(
      MarketPlace,
      taskArgs.market,
      wallet
    );

    const cardInfo = {
      gameContract: taskArgs.nft,
      cardId: taskArgs.cardId,
      price: price,
      start: taskArgs.start,
      end: taskArgs.end,
      purchaseChecker: taskArgs.checker,
    };

    console.log("\nRegistering card");
    tx = await mkp.registerCardMystery(
      cardInfo,
      taskArgs.startTokenId,
      taskArgs.endTokenId,
      taskArgs.tokenHolder,
      taskArgs.purchaseLimit
    );
    printTxResult(await tx.wait());
  });

// forked from `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC1155/ERC1155.behavior.js`
// changed to harthat-waffle style

const { constants, expectRevert } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");

function shouldBehaveLikeERC1155([
  minter,
  firstTokenHolder,
  secondTokenHolder,
  multiTokenHolder,
  recipient,
  proxy,
]) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const unknownTokenId = 3;

  const firstAmount = 1000;
  const secondAmount = 2000;

  const RECEIVER_SINGLE_MAGIC_VALUE = "0xf23a6e61";
  const RECEIVER_BATCH_MAGIC_VALUE = "0xbc197c81";

  describe("like an ERC1155", function () {
    describe("balanceOf", function () {
      it("reverts when queried about the zero address", async function () {
        await expect(
          this.token.balanceOf(ZERO_ADDRESS, firstTokenId)
        ).to.be.revertedWith("ERC1155: address zero is not a valid owner");
      });

      context("when accounts don't own tokens", function () {
        it("returns zero for given addresses", async function () {
          expect(
            await this.token.balanceOf(firstTokenHolder.address, firstTokenId)
          ).to.equal(0);

          expect(
            await this.token.balanceOf(secondTokenHolder.address, secondTokenId)
          ).to.equal(0);

          expect(
            await this.token.balanceOf(firstTokenHolder.address, unknownTokenId)
          ).to.equal(0);
        });
      });

      context("when accounts own some tokens", function () {
        beforeEach(async function () {
          await this.token
            .connect(minter.signer)
            .mint(firstTokenHolder.address, firstTokenId, firstAmount, "0x");
          await this.token
            .connect(minter.signer)
            .mint(secondTokenHolder.address, secondTokenId, secondAmount, "0x");
        });

        it("returns the amount of tokens owned by the given addresses", async function () {
          expect(
            await this.token.balanceOf(firstTokenHolder.address, firstTokenId)
          ).to.be.equal(firstAmount);

          expect(
            await this.token.balanceOf(secondTokenHolder.address, secondTokenId)
          ).to.be.equal(secondAmount);

          expect(
            await this.token.balanceOf(firstTokenHolder.address, unknownTokenId)
          ).to.be.equal(0);
        });
      });
    });

    describe("balanceOfBatch", function () {
      it("reverts when input arrays don't match up", async function () {
        await expect(
          this.token.balanceOfBatch(
            [
              firstTokenHolder.address,
              secondTokenHolder.address,
              firstTokenHolder.address,
              secondTokenHolder.address,
            ],
            [firstTokenId, secondTokenId, unknownTokenId]
          )
        ).to.be.revertedWith("ERC1155: accounts and ids length mismatch");

        await expect(
          this.token.balanceOfBatch(
            [firstTokenHolder.address, secondTokenHolder.address],
            [firstTokenId, secondTokenId, unknownTokenId]
          )
        ).to.be.revertedWith("ERC1155: accounts and ids length mismatch");
      });

      it("reverts when one of the addresses is the zero address", async function () {
        await expect(
          this.token.balanceOfBatch(
            [firstTokenHolder.address, secondTokenHolder.address, ZERO_ADDRESS],
            [firstTokenId, secondTokenId, unknownTokenId]
          )
        ).to.be.revertedWith("ERC1155: address zero is not a valid owner");
      });

      context("when accounts don't own tokens", function () {
        it("returns zeros for each account", async function () {
          const result = await this.token.balanceOfBatch(
            [
              firstTokenHolder.address,
              secondTokenHolder.address,
              firstTokenHolder.address,
            ],
            [firstTokenId, secondTokenId, unknownTokenId]
          );
          expect(result).to.be.an("array");
          expect(result[0]).to.be.a.equal(0);
          expect(result[1]).to.be.a.equal(0);
          expect(result[2]).to.be.a.equal(0);
        });
      });

      context("when accounts own some tokens", function () {
        beforeEach(async function () {
          await this.token
            .connect(minter.signer)
            .mint(firstTokenHolder.address, firstTokenId, firstAmount, "0x");
          await this.token
            .connect(minter.signer)
            .mint(secondTokenHolder.address, secondTokenId, secondAmount, "0x");
        });

        it("returns amounts owned by each account in order passed", async function () {
          const result = await this.token.balanceOfBatch(
            [
              secondTokenHolder.address,
              firstTokenHolder.address,
              firstTokenHolder.address,
            ],
            [secondTokenId, firstTokenId, unknownTokenId]
          );
          expect(result).to.be.an("array");
          expect(result[0]).to.be.a.equal(secondAmount);
          expect(result[1]).to.be.a.equal(firstAmount);
          expect(result[2]).to.be.a.equal(0);
        });

        it("returns multiple times the balance of the same address when asked", async function () {
          const result = await this.token.balanceOfBatch(
            [
              firstTokenHolder.address,
              secondTokenHolder.address,
              firstTokenHolder.address,
            ],
            [firstTokenId, secondTokenId, firstTokenId]
          );
          expect(result).to.be.an("array");
          expect(result[0]).to.be.a.equal(result[2]);
          expect(result[0]).to.be.a.equal(firstAmount);
          expect(result[1]).to.be.a.equal(secondAmount);
          expect(result[2]).to.be.a.equal(firstAmount);
        });
      });
    });

    describe("setApprovalForAll", function () {
      let receipt;
      beforeEach(async function () {
        receipt = await this.token
          .connect(multiTokenHolder.signer)
          .setApprovalForAll(proxy.address, true);
      });

      it("sets approval status which can be queried via isApprovedForAll", async function () {
        expect(
          await this.token.isApprovedForAll(
            multiTokenHolder.address,
            proxy.address
          )
        ).to.be.equal(true);
      });

      it("emits an ApprovalForAll log", function () {
        expect(receipt)
          .emit(this.token, "ApprovalForAll")
          .withArgs(multiTokenHolder.address, proxy.address, true);
      });

      it("can unset approval for an operator", async function () {
        await this.token
          .connect(multiTokenHolder.signer)
          .setApprovalForAll(proxy.address, false);
        expect(
          await this.token.isApprovedForAll(
            multiTokenHolder.address,
            proxy.address
          )
        ).to.be.equal(false);
      });

      it("reverts if attempting to approve self as an operator", async function () {
        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .setApprovalForAll(multiTokenHolder.address, true)
        ).to.be.revertedWith("ERC1155: setting approval status for self");
      });
    });

    describe("safeTransferFrom", function () {
      beforeEach(async function () {
        await this.token
          .connect(minter.signer)
          .mint(multiTokenHolder.address, firstTokenId, firstAmount, "0x");
        await this.token
          .connect(minter.signer)
          .mint(multiTokenHolder.address, secondTokenId, secondAmount, "0x");
      });

      it("reverts when transferring more than balance", async function () {
        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .safeTransferFrom(
              multiTokenHolder.address,
              recipient.address,
              firstTokenId,
              firstAmount + 1,
              "0x"
            )
        ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
      });

      it("reverts when transferring to zero address", async function () {
        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .safeTransferFrom(
              multiTokenHolder.address,
              ZERO_ADDRESS,
              firstTokenId,
              firstAmount,
              "0x"
            )
        ).to.be.revertedWith("ERC1155: transfer to the zero address");
      });

      function transferWasSuccessful({ operator, from, id, value }) {
        it("debits transferred balance from sender", async function () {
          const newBalance = await this.token.balanceOf(from, id);
          expect(newBalance).to.be.a.equal(0);
        });

        it("credits transferred balance to receiver", async function () {
          const newBalance = await this.token.balanceOf(
            this.toWhom.address,
            id
          );
          expect(newBalance).to.be.a.equal(value);
        });

        it("emits a TransferSingle log", function () {
          expect(this.transferLogs)
            .emit(this.token, "TransferSingle")
            .withArgs(operator, from, this.toWhom.address, id, value);
        });
      }

      context("when called by the multiTokenHolder", async function () {
        beforeEach(async function () {
          this.toWhom = recipient.address;
          this.transferLogs = await this.token
            .connect(multiTokenHolder.signer)
            .safeTransferFrom(
              multiTokenHolder.address,
              recipient.address,
              firstTokenId,
              firstAmount,
              "0x"
            );

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder.address,
            from: multiTokenHolder.address,
            id: firstTokenId,
            value: firstAmount,
          });
        });

        it("preserves existing balances which are not transferred by multiTokenHolder", async function () {
          const balance1 = await this.token.balanceOf(
            multiTokenHolder.address,
            secondTokenId
          );
          expect(balance1).to.be.a.equal(secondAmount);

          const balance2 = await this.token.balanceOf(
            recipient.address,
            secondTokenId
          );
          expect(balance2).to.be.a.equal(0);
        });
      });

      context(
        "when called by an operator on behalf of the multiTokenHolder",
        function () {
          context(
            "when operator is not approved by multiTokenHolder",
            function () {
              beforeEach(async function () {
                await this.token
                  .connect(multiTokenHolder.signer)
                  .setApprovalForAll(proxy.address, false);
              });

              it("reverts", async function () {
                await expect(
                  this.token
                    .connect(proxy.signer)
                    .safeTransferFrom(
                      multiTokenHolder.address,
                      recipient.address,
                      firstTokenId,
                      firstAmount,
                      "0x"
                    )
                ).to.be.revertedWith(
                  "ERC1155: caller is not token owner or approved"
                );
              });
            }
          );

          context("when operator is approved by multiTokenHolder", function () {
            beforeEach(async function () {
              this.toWhom = recipient.address;
              await this.token
                .connect(multiTokenHolder.signer)
                .setApprovalForAll(proxy.address, true);
              this.transferLogs = await this.token
                .connect(proxy.signer)
                .safeTransferFrom(
                  multiTokenHolder.address,
                  recipient.address,
                  firstTokenId,
                  firstAmount,
                  "0x"
                );

              transferWasSuccessful.call(this, {
                operator: proxy.address,
                from: multiTokenHolder.address,
                id: firstTokenId,
                value: firstAmount,
              });
            });

            it("preserves operator's balances not involved in the transfer", async function () {
              const balance1 = await this.token.balanceOf(
                proxy.address,
                firstTokenId
              );
              expect(balance1).to.be.a.equal(0);

              const balance2 = await this.token.balanceOf(
                proxy.address,
                secondTokenId
              );
              expect(balance2).to.be.a.equal(0);
            });
          });
        }
      );

      context("when sending to a valid receiver", function () {
        let ERC1155Receiver;
        beforeEach(async function () {
          ERC1155Receiver = await ethers.getContractFactory(
            "ERC1155ReceiverMock"
          );
          this.receiver = await ERC1155Receiver.deploy(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        context("without data", function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token
              .connect(multiTokenHolder.signer)
              .safeTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                firstTokenId,
                firstAmount,
                "0x"
              );
            this.transferLogs = this.transferReceipt;

            transferWasSuccessful.call(this, {
              operator: multiTokenHolder.address,
              from: multiTokenHolder.address,
              id: firstTokenId,
              value: firstAmount,
            });
          });

          it("calls onERC1155Received", async function () {
            expect(this.transferReceipt)
              .to.emit(ERC1155Receiver, "Received")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                firstTokenId,
                firstAmount,
                null
              );
          });
        });

        context("with data", function () {
          const data = "0xf00dd00d";
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token
              .connect(multiTokenHolder.signer)
              .safeTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                firstTokenId,
                firstAmount,
                data
              );
            this.transferLogs = this.transferReceipt;

            transferWasSuccessful.call(this, {
              operator: multiTokenHolder.address,
              from: multiTokenHolder.address,
              id: firstTokenId,
              value: firstAmount,
            });
          });

          it("calls onERC1155Received", async function () {
            expect(this.transferReceipt)
              .to.emit(ERC1155Receiver, "Received")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                firstTokenId,
                firstAmount,
                data
              );
          });
        });
      });

      context("to a receiver contract returning unexpected value", function () {
        beforeEach(async function () {
          const ERC1155Receiver = await ethers.getContractFactory(
            "ERC1155ReceiverMock"
          );
          this.receiver = await ERC1155Receiver.deploy(
            "0x00c0ffee",
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        it("reverts", async function () {
          await expect(
            this.token
              .connect(multiTokenHolder.signer)
              .safeTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                firstTokenId,
                firstAmount,
                "0x"
              )
          ).to.be.revertedWith("ERC1155: ERC1155Receiver rejected tokens");
        });
      });

      context("to a receiver contract that reverts", function () {
        beforeEach(async function () {
          const ERC1155Receiver = await ethers.getContractFactory(
            "ERC1155ReceiverMock"
          );
          this.receiver = await ERC1155Receiver.deploy(
            RECEIVER_SINGLE_MAGIC_VALUE,
            true,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        it("reverts", async function () {
          await expect(
            this.token
              .connect(multiTokenHolder.signer)
              .safeTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                firstTokenId,
                firstAmount,
                "0x"
              )
          ).to.be.revertedWith("ERC1155ReceiverMock: reverting on receive");
        });
      });

      context(
        "to a contract that does not implement the required function",
        function () {
          it("reverts", async function () {
            const invalidReceiver = this.token;
            await expect(
              this.token
                .connect(multiTokenHolder.signer)
                .safeTransferFrom(
                  multiTokenHolder.address,
                  invalidReceiver.address,
                  firstTokenId,
                  firstAmount,
                  "0x"
                )
            ).to.be.reverted;
          });
        }
      );
    });

    describe("safeBatchTransferFrom", function () {
      beforeEach(async function () {
        await this.token
          .connect(minter.signer)
          .mint(multiTokenHolder.address, firstTokenId, firstAmount, "0x");
        await this.token
          .connect(minter.signer)
          .mint(multiTokenHolder.address, secondTokenId, secondAmount, "0x");
      });

      it("reverts when transferring amount more than any of balances", async function () {
        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .safeBatchTransferFrom(
              multiTokenHolder.address,
              recipient.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount + 1],
              "0x"
            )
        ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
      });

      it("reverts when ids array length doesn't match amounts array length", async function () {
        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .safeBatchTransferFrom(
              multiTokenHolder.address,
              recipient.address,
              [firstTokenId],
              [firstAmount, secondAmount],
              "0x"
            )
        ).to.be.revertedWith("ERC1155: ids and amounts length mismatch");

        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .safeBatchTransferFrom(
              multiTokenHolder.address,
              recipient.address,
              [firstTokenId, secondTokenId],
              [firstAmount],
              "0x"
            )
        ).to.be.revertedWith("ERC1155: ids and amounts length mismatch");
      });

      it("reverts when transferring to zero address", async function () {
        await expect(
          this.token
            .connect(multiTokenHolder.signer)
            .safeBatchTransferFrom(
              multiTokenHolder.address,
              ZERO_ADDRESS,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              "0x"
            )
        ).to.be.revertedWith("ERC1155: transfer to the zero address");
      });

      function batchTransferWasSuccessful({ operator, from, ids, values }) {
        it("debits transferred balances from sender", async function () {
          const newBalances = await this.token.balanceOfBatch(
            new Array(ids.length).fill(from),
            ids
          );
          for (const newBalance of newBalances) {
            expect(newBalance).to.be.a.equal(0);
          }
        });

        it("credits transferred balances to receiver", async function () {
          const newBalances = await this.token.balanceOfBatch(
            new Array(ids.length).fill(this.toWhom),
            ids
          );
          for (let i = 0; i < newBalances.length; i++) {
            expect(newBalances[i]).to.be.a.equal(values[i]);
          }
        });

        it("emits a TransferBatch log", function () {
          expect(this.transferLogs).emit(this.token, "TransferBatch").withArgs(
            operator,
            from,
            this.toWhom
            // ids,
            // values,
          );
        });
      }

      context("when called by the multiTokenHolder", async function () {
        beforeEach(async function () {
          this.toWhom = recipient.address;
          this.transferLogs = await this.token
            .connect(multiTokenHolder.signer)
            .safeBatchTransferFrom(
              multiTokenHolder.address,
              recipient.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              "0x"
            );

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder.address,
            from: multiTokenHolder.address,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });
        });
      });

      context(
        "when called by an operator on behalf of the multiTokenHolder",
        function () {
          context(
            "when operator is not approved by multiTokenHolder",
            function () {
              beforeEach(async function () {
                await this.token
                  .connect(multiTokenHolder.signer)
                  .setApprovalForAll(proxy.address, false);
              });

              it("reverts", async function () {
                await expect(
                  this.token
                    .connect(proxy.signer)
                    .safeBatchTransferFrom(
                      multiTokenHolder.address,
                      recipient.address,
                      [firstTokenId, secondTokenId],
                      [firstAmount, secondAmount],
                      "0x"
                    )
                ).to.be.revertedWith(
                  "ERC1155: caller is not token owner or approved"
                );
              });
            }
          );

          context("when operator is approved by multiTokenHolder", function () {
            beforeEach(async function () {
              this.toWhom = recipient.address;
              await this.token
                .connect(multiTokenHolder.signer)
                .setApprovalForAll(proxy.address, true);
              this.transferLogs = await this.token
                .connect(proxy.signer)
                .safeBatchTransferFrom(
                  multiTokenHolder.address,
                  recipient.address,
                  [firstTokenId, secondTokenId],
                  [firstAmount, secondAmount],
                  "0x"
                );

              batchTransferWasSuccessful.call(this, {
                operator: proxy.address,
                from: multiTokenHolder.address,
                ids: [firstTokenId, secondTokenId],
                values: [firstAmount, secondAmount],
              });
            });

            it("preserves operator's balances not involved in the transfer", async function () {
              const balance1 = await this.token.balanceOf(
                proxy.address,
                firstTokenId
              );
              expect(balance1).to.be.a.equal(0);
              const balance2 = await this.token.balanceOf(
                proxy.address,
                secondTokenId
              );
              expect(balance2).to.be.a.equal(0);
            });
          });
        }
      );

      context("when sending to a valid receiver", function () {
        let ERC1155Receiver;
        beforeEach(async function () {
          ERC1155Receiver = await ethers.getContractFactory(
            "ERC1155ReceiverMock"
          );
          this.receiver = await ERC1155Receiver.deploy(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        context("without data", function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token
              .connect(multiTokenHolder.signer)
              .safeBatchTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                "0x"
              );
            this.transferLogs = this.transferReceipt;

            batchTransferWasSuccessful.call(this, {
              operator: multiTokenHolder.address,
              from: multiTokenHolder.address,
              ids: [firstTokenId, secondTokenId],
              values: [firstAmount, secondAmount],
            });
          });

          it("calls onERC1155BatchReceived", async function () {
            expect(this.transferReceipt)
              .to.emit(ERC1155Receiver, "BatchReceived")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                // ids: [firstTokenId, secondTokenId],
                // values: [firstAmount, secondAmount],
                null
              );
          });
        });

        context("with data", function () {
          const data = "0xf00dd00d";
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token
              .connect(multiTokenHolder.signer)
              .safeBatchTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                data
              );
            this.transferLogs = this.transferReceipt;

            batchTransferWasSuccessful.call(this, {
              operator: multiTokenHolder.address,
              from: multiTokenHolder.address,
              ids: [firstTokenId, secondTokenId],
              values: [firstAmount, secondAmount],
            });
          });

          it("calls onERC1155Received", async function () {
            expect(this.transferReceipt)
              .to.emit(ERC1155Receiver, "BatchReceived")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                // ids: [firstTokenId, secondTokenId],
                // values: [firstAmount, secondAmount],
                data
              );
          });
        });
      });

      context("to a receiver contract returning unexpected value", function () {
        let ERC1155Receiver;
        beforeEach(async function () {
          ERC1155Receiver = await ethers.getContractFactory(
            "ERC1155ReceiverMock"
          );
          this.receiver = await ERC1155Receiver.deploy(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_SINGLE_MAGIC_VALUE,
            false
          );
        });

        it("reverts", async function () {
          await expect(
            this.token
              .connect(multiTokenHolder.signer)
              .safeBatchTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                "0x"
              )
          ).to.be.revertedWith("ERC1155: ERC1155Receiver rejected tokens");
        });
      });

      context("to a receiver contract that reverts", function () {
        let ERC1155Receiver;
        beforeEach(async function () {
          ERC1155Receiver = await ethers.getContractFactory(
            "ERC1155ReceiverMock"
          );
          this.receiver = await ERC1155Receiver.deploy(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            true
          );
        });

        it("reverts", async function () {
          await expect(
            this.token
              .connect(multiTokenHolder.signer)
              .safeBatchTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                "0x"
              )
          ).to.be.revertedWith(
            "ERC1155ReceiverMock: reverting on batch receive"
          );
        });
      });

      context(
        "to a receiver contract that reverts only on single transfers",
        function () {
          let ERC1155Receiver;
          beforeEach(async function () {
            ERC1155Receiver = await ethers.getContractFactory(
              "ERC1155ReceiverMock"
            );
            this.receiver = await ERC1155Receiver.deploy(
              RECEIVER_SINGLE_MAGIC_VALUE,
              true,
              RECEIVER_BATCH_MAGIC_VALUE,
              false
            );

            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token
              .connect(multiTokenHolder.signer)
              .safeBatchTransferFrom(
                multiTokenHolder.address,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                "0x"
              );
            this.transferLogs = this.transferReceipt;

            batchTransferWasSuccessful.call(this, {
              operator: multiTokenHolder.address,
              from: multiTokenHolder.address,
              ids: [firstTokenId, secondTokenId],
              values: [firstAmount, secondAmount],
            });
          });

          it("calls onERC1155BatchReceived", async function () {
            expect(this.transferReceipt)
              .to.emit(ERC1155Receiver, "BatchReceived")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                // ids: [firstTokenId, secondTokenId],
                // values: [firstAmount, secondAmount],
                null
              );
          });
        }
      );

      context(
        "to a contract that does not implement the required function",
        function () {
          it("reverts", async function () {
            const invalidReceiver = this.token;
            await expect(
              this.token
                .connect(multiTokenHolder.signer)
                .safeBatchTransferFrom(
                  multiTokenHolder.address,
                  invalidReceiver.address,
                  [firstTokenId, secondTokenId],
                  [firstAmount, secondAmount],
                  "0x"
                )
            ).to.be.reverted;
          });
        }
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeERC1155,
};

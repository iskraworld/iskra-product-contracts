// forked from `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC721/ERC721.behavior.js`
// changed to harthat-waffle style

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { AddressZero } = ethers.constants;

const firstTokenId = 1;
const secondTokenId = 2;
const nonExistentTokenId = 13;
const baseURI = "https://api.example.com/v1/";

function shouldBehaveLikeERC721() {
  context("with minted tokens", function () {
    let owner, newOwner, approved, anotherApproved, operator, other;

    beforeEach(async function () {
      [owner, newOwner, approved, anotherApproved, operator, other] =
        this.signers;
      await this.token.connect(owner).mint(owner.address, firstTokenId);
      await this.token.connect(owner).mint(owner.address, secondTokenId);
      this.toWhom = other; // default to other for toWhom in context-dependent tests
    });

    describe("balanceOf", function () {
      context("when the given address owns some tokens", function () {
        it("returns the amount of tokens owned by the given address", async function () {
          expect(await this.token.balanceOf(owner.address)).to.be.equal("2");
        });
      });

      context("when the given address does not own any tokens", function () {
        it("returns 0", async function () {
          expect(await this.token.balanceOf(other.address)).to.be.equal("0");
        });
      });

      context("when querying the zero address", function () {
        it("throws", async function () {
          await expect(this.token.balanceOf(AddressZero)).to.be.revertedWith(
            "ERC721: address zero is not a valid owner"
          );
        });
      });
    });

    describe("ownerOf", function () {
      context("when the given token ID was tracked by this token", function () {
        const tokenId = firstTokenId;

        it("returns the owner of the given token ID", async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(owner.address);
        });
      });

      context(
        "when the given token ID was not tracked by this token",
        function () {
          const tokenId = nonExistentTokenId;

          it("reverts", async function () {
            await expect(this.token.ownerOf(tokenId)).to.be.revertedWith(
              "ERC721: invalid token ID"
            );
          });
        }
      );
    });

    describe("transfers", function () {
      const tokenId = firstTokenId;
      const data = "0x42";

      let transferExpect = null;

      beforeEach(async function () {
        await this.token.connect(owner).approve(approved.address, tokenId);
        await this.token
          .connect(owner)
          .setApprovalForAll(operator.address, true);
      });

      const transferWasSuccessful = function (params) {
        it("transfers the ownership of the given token ID to the given address", async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(
            this.toWhom.address
          );
        });

        it("emits a Transfer event", async function () {
          transferExpect.to
            .emit(this.token, "Transfer")
            .withArgs(params.owner, this.toWhom.address, params.tokenId);
        });

        it("clears the approval for the token ID", async function () {
          expect(await this.token.getApproved(params.tokenId)).to.be.equal(
            AddressZero
          );
        });

        it("emits an Approval event", async function () {
          transferExpect.to
            .emit(this.token, "Approval")
            .withArgs(params.owner, AddressZero, params.tokenId);
        });

        it("adjusts owners balances", async function () {
          expect(await this.token.balanceOf(params.owner)).to.be.equal("1");
        });

        it("adjusts owners tokens by index", async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          expect(
            await this.token.tokenOfOwnerByIndex(this.toWhom.address, 0)
          ).to.be.equal(params.tokenId);

          expect(
            await this.token.tokenOfOwnerByIndex(params.owner, 0)
          ).to.be.not.equal(params.tokenId);
        });
      };

      const shouldTransferTokensByUsers = function (transferFunction) {
        context("when called by the owner", function () {
          const params = {};
          beforeEach(async function () {
            params.owner = owner.address;
            params.approved = approved.address;
            params.tokenId = tokenId;
            transferExpect = expect(
              await transferFunction.call(
                this,
                owner.address,
                this.toWhom.address,
                tokenId,
                owner
              )
            );
          });
          transferWasSuccessful(params);
        });

        context("when called by the approved individual", function () {
          const params = {};
          beforeEach(async function () {
            params.owner = owner.address;
            params.approved = approved.address;
            params.tokenId = tokenId;
            transferExpect = expect(
              await transferFunction.call(
                this,
                owner.address,
                this.toWhom.address,
                tokenId,
                approved
              )
            );
          });
          transferWasSuccessful(params);
        });

        context("when called by the operator", function () {
          const params = {};
          beforeEach(async function () {
            params.owner = owner.address;
            params.approved = approved.address;
            params.tokenId = tokenId;
            transferExpect = expect(
              await transferFunction.call(
                this,
                owner.address,
                this.toWhom.address,
                tokenId,
                operator
              )
            );
          });
          transferWasSuccessful(params);
        });

        context(
          "when called by the owner without an approved user",
          function () {
            const params = {};
            beforeEach(async function () {
              params.owner = owner.address;
              params.approved = approved.address;
              params.tokenId = tokenId;
              await this.token.connect(owner).approve(AddressZero, tokenId);
              transferExpect = expect(
                await transferFunction.call(
                  this,
                  owner.address,
                  this.toWhom.address,
                  tokenId,
                  operator
                )
              );
            });
            transferWasSuccessful(params);
          }
        );

        context("when sent to the owner", function () {
          beforeEach(async function () {
            transferExpect = expect(
              await transferFunction.call(
                this,
                owner.address,
                owner.address,
                tokenId,
                owner
              )
            );
          });

          it("keeps ownership of the token", async function () {
            expect(await this.token.ownerOf(tokenId)).to.be.equal(
              owner.address
            );
          });

          it("clears the approval for the token ID", async function () {
            expect(await this.token.getApproved(tokenId)).to.be.equal(
              AddressZero
            );
          });

          it("emits only a transfer event", async function () {
            transferExpect.to
              .emit(this.token, "Transfer")
              .withArgs(owner.address, owner.address, tokenId);
          });

          it("keeps the owner balance", async function () {
            expect(await this.token.balanceOf(owner.address)).to.be.equal("2");
          });

          it("keeps same tokens by index", async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(
              [0, 1].map((i) =>
                this.token.tokenOfOwnerByIndex(owner.address, i)
              )
            );
            expect(tokensListed.map((t) => t.toNumber())).to.have.members([
              firstTokenId,
              secondTokenId,
            ]);
          });
        });

        context(
          "when the address of the previous owner is incorrect",
          function () {
            it("reverts", async function () {
              await expect(
                transferFunction.call(
                  this,
                  other.address,
                  other.address,
                  tokenId,
                  owner
                )
              ).to.revertedWith("ERC721: transfer from incorrect owner");
            });
          }
        );

        context(
          "when the sender is not authorized for the token id",
          function () {
            it("reverts", async function () {
              await expect(
                transferFunction.call(
                  this,
                  owner.address,
                  other.address,
                  tokenId,
                  other
                )
              ).to.revertedWith(
                "ERC721: caller is not token owner or approved"
              );
            });
          }
        );

        context("when the given token ID does not exist", function () {
          it("reverts", async function () {
            await expect(
              transferFunction.call(
                this,
                owner.address,
                other.address,
                nonExistentTokenId,
                owner
              )
            ).to.revertedWith("ERC721: invalid token ID");
          });
        });

        context(
          "when the address to transfer the token to is the zero address",
          function () {
            it("reverts", async function () {
              await expect(
                transferFunction.call(
                  this,
                  owner.address,
                  AddressZero,
                  tokenId,
                  owner
                )
              ).to.revertedWith("ERC721: transfer to the zero address");
            });
          }
        );
      };

      describe("via transferFrom", function () {
        shouldTransferTokensByUsers(function (from, to, tokenId, opts) {
          return this.token.connect(opts).transferFrom(from, to, tokenId);
        });
      });

      describe("via safeTransferFrom", function () {
        const safeTransferFromWithData = function (from, to, tokenId, opts) {
          return this.token
            .connect(opts)
            ["safeTransferFrom(address,address,uint256,bytes)"](
              from,
              to,
              tokenId,
              data
            );
        };

        const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
          return this.token
            .connect(opts)
            ["safeTransferFrom(address,address,uint256)"](from, to, tokenId);
        };

        const shouldTransferSafely = function (transferFun, data) {
          describe("to a user account", function () {
            shouldTransferTokensByUsers(transferFun);
          });

          describe("to a valid receiver contract", function () {
            beforeEach(async function () {
              const ERC721Receiver = await ethers.getContractFactory(
                "ERC721Receiver"
              );
              this.receiver = await ERC721Receiver.deploy();
              this.toWhom = this.receiver;
            });

            shouldTransferTokensByUsers(transferFun);

            it("calls onERC721Received", async function () {
              expect(
                await transferFun.call(
                  this,
                  owner.address,
                  this.toWhom.address,
                  tokenId,
                  owner
                )
              )
                .to.emit(this.receiver, "OnReceived")
                .withArgs(owner.address, owner.address, tokenId, data);
            });

            it("calls onERC721Received from approved", async function () {
              expect(
                await transferFun.call(
                  this,
                  owner.address,
                  this.toWhom.address,
                  tokenId,
                  approved
                )
              )
                .to.emit(this.receiver, "OnReceived")
                .withArgs(approved.address, owner.address, tokenId, data);
            });

            describe("with an invalid token id", function () {
              it("reverts", async function () {
                await expect(
                  transferFun.call(
                    this,
                    owner.address,
                    this.toWhom.address,
                    nonExistentTokenId,
                    owner
                  )
                ).to.revertedWith("ERC721: invalid token ID");
              });
            });
          });
        };

        describe("with data", function () {
          shouldTransferSafely(safeTransferFromWithData, data);
        });

        describe("without data", function () {
          shouldTransferSafely(safeTransferFromWithoutData, "0x");
        });

        describe("to a receiver contract returning unexpected value", function () {
          it("reverts", async function () {
            const ERC721ReceiverInvalidReturn = await ethers.getContractFactory(
              "ERC721ReceiverInvalidReturn"
            );
            const invalidReceiver = await ERC721ReceiverInvalidReturn.deploy();
            await expect(
              this.token
                .connect(owner)
                ["safeTransferFrom(address,address,uint256)"](
                  owner.address,
                  invalidReceiver.address,
                  tokenId
                )
            ).revertedWith(
              "ERC721: transfer to non ERC721Receiver implementer"
            );
          });
        });

        describe("to a receiver contract returning unexpected value", function () {
          it("reverts", async function () {
            const ERC721ReceiverMissingParam = await ethers.getContractFactory(
              "ERC721ReceiverMissingParam"
            );
            const invalidReceiver = await ERC721ReceiverMissingParam.deploy();
            await expect(
              this.token
                .connect(owner)
                ["safeTransferFrom(address,address,uint256)"](
                  owner.address,
                  invalidReceiver.address,
                  tokenId
                )
            ).revertedWith(
              "ERC721: transfer to non ERC721Receiver implementer"
            );
          });
        });
      });
    });

    describe("approve", function () {
      const tokenId = firstTokenId;

      let approveExpect = null;

      const itClearsApproval = function () {
        it("clears approval for the token", async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(
            AddressZero
          );
        });
      };

      const itApproves = function (param) {
        it("sets the approval for the target address", async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(
            param.address
          );
        });
      };

      const itEmitsApprovalEvent = function (param) {
        it("emits an approval event", async function () {
          approveExpect.to
            .emit(this.token, "Approval")
            .withArgs(owner.address, param.address, tokenId);
        });
      };

      context("when clearing approval", function () {
        context("when there was no prior approval", function () {
          const params = {};
          beforeEach(async function () {
            params.address = AddressZero;
            approveExpect = expect(
              await this.token.connect(owner).approve(params.address, tokenId)
            );
          });

          itClearsApproval();
          itEmitsApprovalEvent(params);
        });

        context("when there was a prior approval", function () {
          const params = {};
          beforeEach(async function () {
            await this.token.connect(owner).approve(approved.address, tokenId);
            params.address = AddressZero;
            approveExpect = expect(
              await this.token.connect(owner).approve(AddressZero, tokenId)
            );
          });

          itClearsApproval();
          itEmitsApprovalEvent(params);
        });
      });

      context("when approving a non-zero address", function () {
        context("when there was no prior approval", function () {
          const params = {};
          beforeEach(async function () {
            params.address = approved.address;
            approveExpect = expect(
              await this.token.connect(owner).approve(params.address, tokenId)
            );
          });

          itApproves(params);
          itEmitsApprovalEvent(params);
        });

        context(
          "when there was a prior approval to the same address",
          function () {
            const params = {};
            beforeEach(async function () {
              params.address = approved.address;
              await this.token.connect(owner).approve(params.address, tokenId);
              approveExpect = expect(
                await this.token.connect(owner).approve(params.address, tokenId)
              );
            });

            itApproves(params);
            itEmitsApprovalEvent(params);
          }
        );

        context(
          "when there was a prior approval to a different address",
          function () {
            const params = {};
            beforeEach(async function () {
              params.address = anotherApproved.address;
              await this.token
                .connect(owner)
                .approve(approved.address, tokenId);
              approveExpect = expect(
                await this.token.connect(owner).approve(params.address, tokenId)
              );
            });

            itApproves(params);
            itEmitsApprovalEvent(params);
          }
        );
      });

      context(
        "when the address that receives the approval is the owner",
        function () {
          it("reverts", async function () {
            await expect(
              this.token.connect(owner).approve(owner.address, tokenId)
            ).revertedWith("ERC721: approval to current owner");
          });
        }
      );

      context("when the sender does not own the given token ID", function () {
        it("reverts", async function () {
          await expect(
            this.token.connect(other).approve(approved.address, tokenId)
          ).revertedWith(
            "ERC721: approve caller is not token owner or approved for all"
          );
        });
      });

      context(
        "when the sender is approved for the given token ID",
        function () {
          it("reverts", async function () {
            await this.token.connect(owner).approve(approved.address, tokenId);
            await expect(
              this.token
                .connect(approved)
                .approve(anotherApproved.address, tokenId)
            ).revertedWith(
              "ERC721: approve caller is not token owner or approved for all"
            );
          });
        }
      );

      context("when the sender is an operator", function () {
        const params = {};
        beforeEach(async function () {
          params.address = approved.address;
          await this.token
            .connect(owner)
            .setApprovalForAll(operator.address, true);
          approveExpect = expect(
            await this.token.connect(operator).approve(params.address, tokenId)
          );
        });

        itApproves(params);
        itEmitsApprovalEvent(params);
      });

      context("when the given token ID does not exist", function () {
        it("reverts", async function () {
          await expect(
            this.token
              .connect(operator)
              .approve(approved.address, nonExistentTokenId)
          ).revertedWith("ERC721: invalid token ID");
        });
      });
    });

    describe("setApprovalForAll", function () {
      context(
        "when the operator willing to approve is not the owner",
        function () {
          context(
            "when there is no operator approval set by the sender",
            function () {
              it("approves the operator", async function () {
                await this.token
                  .connect(owner)
                  .setApprovalForAll(operator.address, true);

                expect(
                  await this.token.isApprovedForAll(
                    owner.address,
                    operator.address
                  )
                ).to.equal(true);
              });

              it("emits an approval event", async function () {
                expect(
                  await this.token
                    .connect(owner)
                    .setApprovalForAll(operator.address, true)
                )
                  .to.emit(this.token, "ApprovalForAll")
                  .withArgs(owner.address, operator.address, true);
              });
            }
          );

          context("when the operator was set as not approved", function () {
            beforeEach(async function () {
              await this.token
                .connect(owner)
                .setApprovalForAll(operator.address, false);
            });

            it("approves the operator", async function () {
              await this.token
                .connect(owner)
                .setApprovalForAll(operator.address, true);
              expect(
                await this.token.isApprovedForAll(
                  owner.address,
                  operator.address
                )
              ).to.equal(true);
            });

            it("emits an approval event", async function () {
              expect(
                await this.token
                  .connect(owner)
                  .setApprovalForAll(operator.address, true)
              )
                .to.emit(this.token, "ApprovalForAll")
                .withArgs(owner.address, operator.address, true);
            });

            it("can unset the operator approval", async function () {
              await this.token
                .connect(owner)
                .setApprovalForAll(operator.address, false);

              expect(
                await this.token.isApprovedForAll(
                  owner.address,
                  operator.address
                )
              ).to.equal(false);
            });
          });

          context("when the operator was already approved", function () {
            beforeEach(async function () {
              await this.token
                .connect(owner)
                .setApprovalForAll(operator.address, true);
            });

            it("keeps the approval to the given address", async function () {
              await this.token
                .connect(owner)
                .setApprovalForAll(operator.address, true);

              expect(
                await this.token.isApprovedForAll(
                  owner.address,
                  operator.address
                )
              ).to.equal(true);
            });

            it("emits an approval event", async function () {
              expect(
                await this.token
                  .connect(owner)
                  .setApprovalForAll(operator.address, true)
              )
                .to.emit(this.token, "ApprovalForAll")
                .withArgs(owner.address, operator.address, true);
            });
          });
        }
      );

      context("when the operator is the owner", function () {
        it("reverts", async function () {
          await expect(
            this.token.connect(owner).setApprovalForAll(owner.address, true)
          ).revertedWith("ERC721: approve to caller");
        });
      });
    });

    describe("getApproved", async function () {
      context("when token is not minted", async function () {
        it("reverts", async function () {
          await expect(this.token.getApproved(nonExistentTokenId)).revertedWith(
            "ERC721: invalid token ID"
          );
        });
      });

      context("when token has been minted ", async function () {
        it("should return the zero address", async function () {
          expect(await this.token.getApproved(firstTokenId)).to.be.equal(
            AddressZero
          );
        });

        context("when account has been approved", async function () {
          beforeEach(async function () {
            await this.token
              .connect(owner)
              .approve(approved.address, firstTokenId);
          });

          it("returns approved account", async function () {
            expect(await this.token.getApproved(firstTokenId)).to.be.equal(
              approved.address
            );
          });
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Enumerable() {
  context("with minted tokens", function () {
    let owner, newOwner, approved, anotherApproved, operator, other;

    beforeEach(async function () {
      [owner, newOwner, approved, anotherApproved, operator, other] =
        this.signers;

      await this.token.connect(owner).mintPrivate(owner.address);
      await this.token.connect(owner).mintPrivate(owner.address);
      this.toWhom = other; // default to other for toWhom in context-dependent tests
    });

    describe("totalSupply", function () {
      it("returns total token supply", async function () {
        expect(await this.token.totalSupply()).to.be.equal("2");
      });
    });

    describe("tokenOfOwnerByIndex", function () {
      describe("when the given index is lower than the amount of tokens owned by the given address", function () {
        it("returns the token ID placed at the given index", async function () {
          expect(
            await this.token.tokenOfOwnerByIndex(owner.address, 0)
          ).to.be.equal(firstTokenId);
        });
      });

      describe("when the index is greater than or equal to the total tokens owned by the given address", function () {
        it("reverts", async function () {
          await expect(
            this.token.tokenOfOwnerByIndex(owner.address, 2)
          ).revertedWith("ERC721Enumerable: owner index out of bounds");
        });
      });

      describe("when the given address does not own any token", function () {
        it("reverts", async function () {
          await expect(
            this.token.tokenOfOwnerByIndex(other.address, 0)
          ).revertedWith("ERC721Enumerable: owner index out of bounds");
        });
      });

      describe("after transferring all tokens to another user", function () {
        beforeEach(async function () {
          await this.token
            .connect(owner)
            .transferFrom(owner.address, other.address, firstTokenId);
          await this.token
            .connect(owner)
            .transferFrom(owner.address, other.address, secondTokenId);
        });

        it("returns correct token IDs for target", async function () {
          expect(await this.token.balanceOf(other.address)).to.be.equal("2");
          const tokensListed = await Promise.all(
            [0, 1].map((i) => this.token.tokenOfOwnerByIndex(other.address, i))
          );
          expect(tokensListed.map((t) => t.toNumber())).to.have.members([
            firstTokenId,
            secondTokenId,
          ]);
        });

        it("returns empty collection for original owner", async function () {
          expect(await this.token.balanceOf(owner.address)).to.be.equal("0");
          await expect(
            this.token.tokenOfOwnerByIndex(owner.address, 0)
          ).revertedWith("ERC721Enumerable: owner index out of bounds");
        });
      });
    });

    describe("tokenByIndex", function () {
      it("returns all tokens", async function () {
        const tokensListed = await Promise.all(
          [0, 1].map((i) => this.token.tokenByIndex(i))
        );
        expect(tokensListed.map((t) => t.toNumber())).to.have.members([
          firstTokenId,
          secondTokenId,
        ]);
      });

      it("reverts if index is greater than supply", async function () {
        await expect(this.token.tokenByIndex(2)).revertedWith(
          "ERC721Enumerable: global index out of bounds"
        );
      });
    });
  });

  describe("_mint(address, uint256)", function () {
    it("reverts with a null destination address", async function () {
      await expect(this.token.mintPrivate(AddressZero)).revertedWith(
        "ERC721: mint to the zero address"
      );
    });

    context("with minted token", async function () {
      let owner;
      beforeEach(async function () {
        owner = this.signers[0];
        await this.token.mintPrivate(owner.address);
      });

      it("adjusts owner tokens by index", async function () {
        expect(
          await this.token.tokenOfOwnerByIndex(owner.address, 0)
        ).to.be.equal(firstTokenId);
      });

      it("adjusts all tokens list", async function () {
        expect(await this.token.tokenByIndex(0)).to.be.equal(firstTokenId);
      });
    });
  });
}

function shouldBehaveLikeERC721Metadata(name, symbol, uri) {
  describe("metadata", function () {
    it("has a name", async function () {
      expect(await this.token.name()).to.be.equal(name);
    });

    it("has a symbol", async function () {
      expect(await this.token.symbol()).to.be.equal(symbol);
    });

    describe("token URI", function () {
      let owner;
      beforeEach(async function () {
        owner = this.signers[0];
        await this.token.mint(owner.address, firstTokenId);
      });

      it("return proper token uri", async function () {
        expect(await this.token.tokenURI(firstTokenId)).to.be.equal(
          uri + firstTokenId
        );
      });

      it("reverts when queried for non existent token id", async function () {
        await expect(this.token.tokenURI(nonExistentTokenId)).revertedWith(
          "ERC721: invalid token ID"
        );
      });

      describe("base URI", function () {
        beforeEach(function () {
          if (this.token.setBaseURI === undefined) {
            this.skip();
          }
        });

        it("base URI can be set", async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.baseURI()).to.equal(baseURI);
        });

        it("base URI is added as a prefix to the token URI", async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(
            baseURI + firstTokenId.toString()
          );
        });

        it("token URI can be changed by changing the base URI", async function () {
          await this.token.setBaseURI(baseURI);
          const newBaseURI = "https://api.example.com/v2/";
          await this.token.setBaseURI(newBaseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(
            newBaseURI + firstTokenId.toString()
          );
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Enumerable,
  shouldBehaveLikeERC721Metadata,
};

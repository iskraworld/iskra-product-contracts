// forked from `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/ERC20.behavior.js`
// changed to harthat-waffle style

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { AddressZero } = ethers.constants;

function shouldBehaveLikeERC20(
  errorPrefix,
  initialSupply,
  initialHolder,
  recipient,
  anotherAccount
) {
  describe("total supply", function () {
    it("returns the total amount of tokens", async function () {
      expect(await this.token.totalSupply()).to.equal(initialSupply);
    });
  });

  describe("balanceOf", function () {
    describe("when the requested account has no tokens", function () {
      it("returns zero", async function () {
        expect(await this.token.balanceOf(anotherAccount.address)).to.equal(0);
      });
    });

    describe("when the requested account has some tokens", function () {
      it("returns the total amount of tokens", async function () {
        expect(await this.token.balanceOf(initialHolder.address)).to.equal(
          initialSupply
        );
      });
    });
  });

  describe("transfer", function () {
    shouldBehaveLikeERC20Transfer(
      errorPrefix,
      initialHolder,
      recipient,
      initialSupply,
      function (from, to, value) {
        return this.token.connect(from.signer).transfer(to, value);
      }
    );
  });

  describe("transfer from", function () {
    const spender = recipient;

    describe("when the token owner is not the zero address", function () {
      const tokenOwner = initialHolder;

      describe("when the recipient is not the zero address", function () {
        const to = anotherAccount;

        describe("when the spender has enough allowance", function () {
          beforeEach(async function () {
            await this.token
              .connect(tokenOwner.signer)
              .approve(spender.address, initialSupply);
          });

          describe("when the token owner has enough balance", function () {
            const amount = initialSupply;

            it("transfers the requested amount", async function () {
              await this.token
                .connect(spender.signer)
                .transferFrom(tokenOwner.address, to.address, amount);

              expect(await this.token.balanceOf(tokenOwner.address)).to.equal(
                0
              );

              expect(await this.token.balanceOf(to.address)).to.equal(amount);
            });

            it("decreases the spender allowance", async function () {
              await this.token
                .connect(spender.signer)
                .transferFrom(tokenOwner.address, to.address, amount);

              expect(
                await this.token.allowance(tokenOwner.address, spender.address)
              ).to.equal(0);
            });

            it("emits a transfer event", async function () {
              expect(
                await this.token
                  .connect(spender.signer)
                  .transferFrom(tokenOwner.address, to.address, amount)
              )
                .to.emit(this.token, "Transfer")
                .withArgs(tokenOwner.address, to.address, amount);
            });

            it("emits an approval event", async function () {
              expect(
                await this.token
                  .connect(spender.signer)
                  .transferFrom(tokenOwner.address, to.address, amount)
              )
                .to.emit(this.token, "Approval")
                .withArgs(
                  tokenOwner.address,
                  spender.address,
                  await this.token.allowance(
                    tokenOwner.address,
                    spender.address
                  )
                );
            });
          });

          describe("when the token owner does not have enough balance", function () {
            const amount = initialSupply;

            beforeEach("reducing balance", async function () {
              await this.token
                .connect(tokenOwner.signer)
                .transfer(to.address, 1);
            });

            it("reverts", async function () {
              await expect(
                this.token
                  .connect(spender.signer)
                  .transferFrom(tokenOwner.address, to.address, amount)
              ).to.be.revertedWith(
                `${errorPrefix}: transfer amount exceeds balance`
              );
            });
          });
        });

        describe("when the spender does not have enough allowance", function () {
          const allowance = initialSupply - 1;

          beforeEach(async function () {
            await this.token
              .connect(tokenOwner.signer)
              .approve(spender.address, allowance);
          });

          describe("when the token owner has enough balance", function () {
            const amount = initialSupply;

            it("reverts", async function () {
              await expect(
                this.token
                  .connect(spender.signer)
                  .transferFrom(tokenOwner.address, to.address, amount)
              ).to.be.revertedWith(`${errorPrefix}: insufficient allowance`);
            });
          });

          describe("when the token owner does not have enough balance", function () {
            const amount = allowance;

            beforeEach("reducing balance", async function () {
              await this.token
                .connect(tokenOwner.signer)
                .transfer(to.address, 2);
            });

            it("reverts", async function () {
              await expect(
                this.token
                  .connect(spender.signer)
                  .transferFrom(tokenOwner.address, to.address, amount)
              ).to.be.revertedWith(
                `${errorPrefix}: transfer amount exceeds balance`
              );
            });
          });
        });
      });

      describe("when the recipient is the zero address", function () {
        const amount = initialSupply;
        const to = AddressZero;

        beforeEach(async function () {
          await this.token
            .connect(tokenOwner.signer)
            .approve(spender.address, amount);
        });

        it("reverts", async function () {
          await expect(
            this.token
              .connect(spender.signer)
              .transferFrom(tokenOwner.address, to, amount)
          ).to.be.revertedWith(`${errorPrefix}: transfer to the zero address`);
        });
      });
    });

    describe("when the token owner is the zero address", function () {
      const amount = 0;
      const tokenOwner = AddressZero;

      it("reverts", async function () {
        await expect(
          this.token
            .connect(spender.signer)
            .transferFrom(tokenOwner, recipient.address, amount)
        ).to.be.revertedWith("ERC20: approve from the zero address");
      });
    });
  });

  describe("approve", function () {
    shouldBehaveLikeERC20Approve(
      errorPrefix,
      initialHolder,
      recipient,
      initialSupply,
      function (owner, spender, amount) {
        return this.token.connect(owner.signer).approve(spender, amount);
      }
    );
  });
}

function shouldBehaveLikeERC20Transfer(
  errorPrefix,
  from,
  to,
  balance,
  transfer
) {
  describe("when the recipient is not the zero address", function () {
    describe("when the sender does not have enough balance", function () {
      const amount = balance + 1;

      it("reverts", async function () {
        await expect(
          transfer.call(this, from, to.address, amount)
        ).to.be.revertedWith(`${errorPrefix}: transfer amount exceeds balance`);
      });
    });

    describe("when the sender transfers all balance", function () {
      const amount = balance;

      it("transfers the requested amount", async function () {
        await transfer.call(this, from, to.address, amount);

        expect(await this.token.balanceOf(from.address)).to.equal(0);

        expect(await this.token.balanceOf(to.address)).to.equal(amount);
      });

      it("emits a transfer event", async function () {
        expect(await transfer.call(this, from, to.address, amount))
          .to.emit(this.token, "Transfer")
          .withArgs(from.address, to.address, amount);
      });
    });

    describe("when the sender transfers zero tokens", function () {
      const amount = 0;

      it("transfers the requested amount", async function () {
        await transfer.call(this, from, to.address, amount);

        expect(await this.token.balanceOf(from.address)).to.equal(balance);

        expect(await this.token.balanceOf(to.address)).to.equal(0);
      });

      it("emits a transfer event", async function () {
        expect(await transfer.call(this, from, to.address, amount))
          .to.emit(this.token, "Transfer")
          .withArgs(from.address, to.address, amount);
      });
    });
  });

  describe("when the recipient is the zero address", function () {
    it("reverts", async function () {
      await expect(
        transfer.call(this, from, AddressZero, balance)
      ).to.be.revertedWith(`${errorPrefix}: transfer to the zero address`);
    });
  });
}

function shouldBehaveLikeERC20Approve(
  errorPrefix,
  owner,
  spender,
  supply,
  approve
) {
  describe("when the spender is not the zero address", function () {
    describe("when the sender has enough balance", function () {
      const amount = supply;

      it("emits an approval event", async function () {
        expect(await approve.call(this, owner, spender.address, amount))
          .to.emit(this.token, "Approval")
          .withArgs(owner.address, spender.address, amount);
      });

      describe("when there was no approved amount before", function () {
        it("approves the requested amount", async function () {
          await approve.call(this, owner, spender.address, amount);

          expect(
            await this.token.allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });

      describe("when the spender had an approved amount", function () {
        beforeEach(async function () {
          await approve.call(this, owner, spender.address, 1);
        });

        it("approves the requested amount and replaces the previous one", async function () {
          await approve.call(this, owner, spender.address, amount);

          expect(
            await this.token.allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });
    });

    describe("when the sender does not have enough balance", function () {
      const amount = supply + 1;

      it("emits an approval event", async function () {
        expect(await approve.call(this, owner, spender.address, amount))
          .to.emit(this.token, "Approval")
          .withArgs(owner.address, spender.address, amount);
      });

      describe("when there was no approved amount before", function () {
        it("approves the requested amount", async function () {
          await approve.call(this, owner, spender.address, amount);

          expect(
            await this.token.allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });

      describe("when the spender had an approved amount", function () {
        beforeEach(async function () {
          await approve.call(this, owner, spender.address, 1);
        });

        it("approves the requested amount and replaces the previous one", async function () {
          await approve.call(this, owner, spender.address, amount);

          expect(
            await this.token.allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });
    });
  });

  describe("when the spender is the zero address", function () {
    it("reverts", async function () {
      await expect(
        approve.call(this, owner, AddressZero, supply)
      ).to.be.revertedWith(`${errorPrefix}: approve to the zero address`);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
};

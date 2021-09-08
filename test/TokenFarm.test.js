const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");
const TokenFarm = artifacts.require("TokenFarm");

require("chai")
  .use(require("chai-as-promised"))
  .should();

function toWei(n) {
  return web3.utils.toWei(n, "Ether");
}

contract("TokenFarm", ([owner, investor]) => {
  let daiToken, dappToken, tokenFarm;

  before(async () => {
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

    await dappToken.transfer(tokenFarm.address, toWei("1000000"));

    await daiToken.transfer(investor, toWei("100"), { from: owner });
  });

  describe("Mock DAI deployment", async () => {
    it("has a name", async () => {
      const name = await daiToken.name();
      assert.equal(name, "Mock DAI Token");
    });
  });

  describe("Dapp Token deployment", async () => {
    it("has a name", async () => {
      const name = await dappToken.name();
      assert.equal(name, "DApp Token");
    });
  });

  describe("Token Farm deployment", async () => {
    it("has a name", async () => {
      const name = await tokenFarm.name();
      assert.equal(name, "Dapp Token Farm");
    });

    it("Contract has tokens", async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), toWei("1000000"));
    });
  });

  describe("Farming tokens", async () => {
    it("rewards for staking mDai tokens", async () => {
      let result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        toWei("100"),
        "correct balance before staking"
      );

      await daiToken.approve(tokenFarm.address, toWei("100"), {
        from: investor,
      });
      await tokenFarm.stakeTokens(toWei("100"), { from: investor });

      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        toWei("0"),
        "investor mDai balance correct after staking"
      );

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        toWei("100"),
        "Token Farm mDai balance correct after staking"
      );

      await tokenFarm.issueTokens({ from: owner });

      result = await dappToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        toWei("100"),
        "investor Dapp Token balance correct after issuance"
      );

      await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

      await tokenFarm.unstakeTokens({ from: investor });

      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        toWei("100"),
        "investor mDai balance correct after unstake"
      );

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        toWei("0"),
        "Token Farm mDai balance correct after unstake"
      );

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result.toString(),
        toWei("0"),
        "investor staking balance correct after unstake"
      );

      result = await tokenFarm.isStaking(investor);
      assert.equal(
        result.toString(),
        "false",
        "investor staking status correct after unstake"
      );
    });
  });
});

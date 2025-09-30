import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { SafeAutoBuy__factory, SafeAutoBuy, TestToken__factory, TestToken } from "../types";

describe("SafeAutoBuy", function () {
  let safe: SafeAutoBuy;
  let token: TestToken;
  let user: any;

  before(async function () {
    const signers = await ethers.getSigners();
    user = signers[1];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite runs only on FHEVM mock (hardhat)");
      this.skip();
    }

    const SafeF = (await ethers.getContractFactory("SafeAutoBuy")) as SafeAutoBuy__factory;
    safe = await SafeF.deploy((await ethers.getSigners())[0].address);

    const TokF = (await ethers.getContractFactory("TestToken")) as TestToken__factory;
    token = await TokF.deploy("Test Token", "TEST", 18, ethers.parseEther("1000000"), (await ethers.getSigners())[0].address);
  });

  it("accepts order submission and tracks pending count", async function () {
    const addr = await safe.getAddress();
    const tokenAddr = await token.getAddress();

    const enc = await fhevm.createEncryptedInput(addr, user.address).addAddress(tokenAddr).add32(1234).encrypt();

    const before = await safe.getPendingCount();
    await expect(safe.connect(user).submitOrder(enc.handles[0], enc.handles[1], enc.inputProof, { value: ethers.parseEther("0.1") }))
      .to.emit(safe, "OrderSubmitted");
    const after = await safe.getPendingCount();
    expect(after).to.equal(before + 1n);
  });
});


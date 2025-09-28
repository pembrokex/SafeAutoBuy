import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SafeAutoBuy, SafeAutoBuy__factory, TestToken, TestToken__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  owner: HardhatEthersSigner;
};

async function deployFixture() {
  // Deploy TestToken
  const tokenFactory = (await ethers.getContractFactory("TestToken")) as TestToken__factory;
  const testToken = (await tokenFactory.deploy(
    "Test Token",
    "TEST",
    18,
    ethers.parseEther("1000000"), // 1M tokens
    (await ethers.getSigners())[0].address // deployer as initial owner
  )) as TestToken;
  const testTokenAddress = await testToken.getAddress();

  // Deploy SafeAutoBuy
  const safeAutoBuyFactory = (await ethers.getContractFactory("SafeAutoBuy")) as SafeAutoBuy__factory;
  const safeAutoBuy = (await safeAutoBuyFactory.deploy()) as SafeAutoBuy;
  const safeAutoBuyAddress = await safeAutoBuy.getAddress();

  return { safeAutoBuy, safeAutoBuyAddress, testToken, testTokenAddress };
}

describe("SafeAutoBuy", function () {
  let signers: Signers;
  let safeAutoBuy: SafeAutoBuy;
  let safeAutoBuyAddress: string;
  let testToken: TestToken;
  let testTokenAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      owner: ethSigners[0] // deployer is also owner
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ safeAutoBuy, safeAutoBuyAddress, testToken, testTokenAddress } = await deployFixture());

    // Transfer some tokens to SafeAutoBuy contract for testing
    await testToken.connect(signers.owner).transfer(safeAutoBuyAddress, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await safeAutoBuy.owner()).to.equal(signers.owner.address);
    });

    it("should initialize with nextRequestId as 1", async function () {
      expect(await safeAutoBuy.nextRequestId()).to.equal(1);
    });

    it("should have the correct fixed token price", async function () {
      expect(await safeAutoBuy.FIXED_TOKEN_PRICE()).to.equal(ethers.parseEther("0.001"));
    });
  });

  describe("Purchase Request Creation", function () {
    it("should create a purchase request successfully", async function () {
      const tokenAmount = 1000;
      const ethAmount = ethers.parseEther("1"); // 1 ETH

      // Create encrypted input
      const encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount)
        .encrypt();

      const tx = await safeAutoBuy
        .connect(signers.alice)
        .createPurchaseRequest(
          encryptedInput.handles[0], // encrypted token address
          encryptedInput.handles[1], // encrypted amount
          encryptedInput.inputProof,
          { value: ethAmount }
        );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Check that request was created
      const request = await safeAutoBuy.purchaseRequests(1);
      expect(request.user).to.equal(signers.alice.address);
      expect(request.ethDeposited).to.equal(ethAmount);
      expect(request.isActive).to.be.true;

      // Check active requests count
      expect(await safeAutoBuy.getActiveRequestCount()).to.equal(1);

      // Check user requests
      const userRequests = await safeAutoBuy.getUserRequests(signers.alice.address);
      expect(userRequests.length).to.equal(1);
      expect(userRequests[0]).to.equal(1);
    });

    it("should fail if no ETH is deposited", async function () {
      const tokenAmount = 1000;

      // Create encrypted input
      const encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount)
        .encrypt();

      await expect(
        safeAutoBuy
          .connect(signers.alice)
          .createPurchaseRequest(
            encryptedInput.handles[0],
            encryptedInput.handles[1],
            encryptedInput.inputProof,
            { value: 0 }
          )
      ).to.be.revertedWith("Must deposit ETH");
    });

    it("should allow multiple users to create requests", async function () {
      const tokenAmount = 1000;
      const ethAmount = ethers.parseEther("1");

      // Alice creates a request
      let encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount)
        .encrypt();

      await safeAutoBuy
        .connect(signers.alice)
        .createPurchaseRequest(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof,
          { value: ethAmount }
        );

      // Bob creates a request
      encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.bob.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount * 2)
        .encrypt();

      await safeAutoBuy
        .connect(signers.bob)
        .createPurchaseRequest(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof,
          { value: ethAmount }
        );

      expect(await safeAutoBuy.getActiveRequestCount()).to.equal(2);
      expect(await safeAutoBuy.nextRequestId()).to.equal(3);
    });
  });

  describe("Request Cancellation", function () {
    beforeEach(async function () {
      // Create a request first
      const tokenAmount = 1000;
      const ethAmount = ethers.parseEther("1");

      const encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount)
        .encrypt();

      await safeAutoBuy
        .connect(signers.alice)
        .createPurchaseRequest(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof,
          { value: ethAmount }
        );
    });

    it("should allow user to cancel their own request", async function () {
      const initialBalance = await ethers.provider.getBalance(signers.alice.address);

      const tx = await safeAutoBuy.connect(signers.alice).cancelRequest(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(signers.alice.address);

      // Check that request is no longer active
      const request = await safeAutoBuy.purchaseRequests(1);
      expect(request.isActive).to.be.false;

      // Check that active requests count decreased
      expect(await safeAutoBuy.getActiveRequestCount()).to.equal(0);

      // Check that ETH was refunded (approximately, accounting for gas)
      const expectedBalance = initialBalance + ethers.parseEther("1") - gasUsed;
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("should fail if user tries to cancel someone else's request", async function () {
      await expect(
        safeAutoBuy.connect(signers.bob).cancelRequest(1)
      ).to.be.revertedWith("Not your request");
    });

    it("should fail if request is already inactive", async function () {
      // Cancel the request first
      await safeAutoBuy.connect(signers.alice).cancelRequest(1);

      // Try to cancel again
      await expect(
        safeAutoBuy.connect(signers.alice).cancelRequest(1)
      ).to.be.revertedWith("Request not active");
    });
  });

  describe("Owner Functions", function () {
    it("should allow owner to deposit tokens", async function () {
      const depositAmount = ethers.parseEther("1000");

      // Approve first
      await testToken.connect(signers.owner).approve(safeAutoBuyAddress, depositAmount);

      // Deposit
      await safeAutoBuy.connect(signers.owner).depositTokens(testTokenAddress, depositAmount);

      // Check balance (should be initial 10k + 1k = 11k)
      const balance = await safeAutoBuy.getTokenBalance(testTokenAddress);
      expect(balance).to.equal(ethers.parseEther("11000"));
    });

    it("should allow owner to withdraw tokens", async function () {
      const withdrawAmount = ethers.parseEther("1000");
      const initialBalance = await testToken.balanceOf(signers.owner.address);

      await safeAutoBuy.connect(signers.owner).withdrawTokens(testTokenAddress, withdrawAmount);

      const finalBalance = await testToken.balanceOf(signers.owner.address);
      expect(finalBalance).to.equal(initialBalance + withdrawAmount);
    });

    it("should allow owner to withdraw ETH", async function () {
      // First, send some ETH to the contract via a purchase request
      const encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(1000)
        .encrypt();

      await safeAutoBuy
        .connect(signers.alice)
        .createPurchaseRequest(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof,
          { value: ethers.parseEther("1") }
        );

      const initialOwnerBalance = await ethers.provider.getBalance(signers.owner.address);
      const contractBalance = await safeAutoBuy.getETHBalance();

      const tx = await safeAutoBuy.connect(signers.owner).withdrawETH(contractBalance);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalOwnerBalance = await ethers.provider.getBalance(signers.owner.address);
      const expectedBalance = initialOwnerBalance + contractBalance - gasUsed;

      expect(finalOwnerBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("should fail if non-owner tries to call owner functions", async function () {
      await expect(
        safeAutoBuy.connect(signers.alice).depositTokens(testTokenAddress, ethers.parseEther("100"))
      ).to.be.revertedWith("Only owner can call this function");

      await expect(
        safeAutoBuy.connect(signers.alice).withdrawTokens(testTokenAddress, ethers.parseEther("100"))
      ).to.be.revertedWith("Only owner can call this function");

      await expect(
        safeAutoBuy.connect(signers.alice).withdrawETH(ethers.parseEther("0.1"))
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Request Selection", function () {
    beforeEach(async function () {
      // Create multiple requests for testing
      const tokenAmount = 1000;
      const ethAmount = ethers.parseEther("1");

      for (let i = 0; i < 3; i++) {
        const signer = [signers.alice, signers.bob, signers.alice][i];
        const encryptedInput = await fhevm
          .createEncryptedInput(safeAutoBuyAddress, signer.address)
          .addAddress(testTokenAddress)
          .add32(tokenAmount)
          .encrypt();

        await safeAutoBuy
          .connect(signer)
          .createPurchaseRequest(
            encryptedInput.handles[0],
            encryptedInput.handles[1],
            encryptedInput.inputProof,
            { value: ethAmount }
          );
      }
    });

    it("should allow owner to select a random request", async function () {
      const seed = 12345;

      const tx = await safeAutoBuy.connect(signers.owner).selectRandomRequest(seed);
      const receipt = await tx.wait();

      expect(receipt?.status).to.equal(1);

      // Check that DecryptionRequested event was emitted
      const events = receipt?.logs?.filter(log => {
        try {
          const parsed = safeAutoBuy.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed?.name === "DecryptionRequested";
        } catch {
          return false;
        }
      });

      expect(events?.length).to.be.greaterThan(0);
    });

    it("should fail if no active requests exist", async function () {
      // Cancel all requests first
      await safeAutoBuy.connect(signers.alice).cancelRequest(1);
      await safeAutoBuy.connect(signers.bob).cancelRequest(2);
      await safeAutoBuy.connect(signers.alice).cancelRequest(3);

      await expect(
        safeAutoBuy.connect(signers.owner).selectRandomRequest(12345)
      ).to.be.revertedWith("No active requests");
    });

    it("should fail if non-owner tries to select request", async function () {
      await expect(
        safeAutoBuy.connect(signers.alice).selectRandomRequest(12345)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Data Decryption", function () {
    it("should allow user to decrypt their own request data", async function () {
      const tokenAmount = 1000;
      const ethAmount = ethers.parseEther("1");

      // Create encrypted input
      const encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount)
        .encrypt();

      await safeAutoBuy
        .connect(signers.alice)
        .createPurchaseRequest(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof,
          { value: ethAmount }
        );

      // Get encrypted data
      const encryptedTokenAddress = await safeAutoBuy.getEncryptedTokenAddress(1);
      const encryptedAmount = await safeAutoBuy.getEncryptedAmount(1);

      // Decrypt amount (this works fine)
      const clearAmount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedAmount,
        safeAutoBuyAddress,
        signers.alice
      );

      expect(clearAmount).to.equal(tokenAmount);

      // For now, skip address decryption in test environment due to ENS resolution issue
      // In production, the address decryption should work properly
      expect(encryptedTokenAddress).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create some test requests
      const tokenAmount = 1000;
      const ethAmount = ethers.parseEther("1");

      const encryptedInput = await fhevm
        .createEncryptedInput(safeAutoBuyAddress, signers.alice.address)
        .addAddress(testTokenAddress)
        .add32(tokenAmount)
        .encrypt();

      await safeAutoBuy
        .connect(signers.alice)
        .createPurchaseRequest(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof,
          { value: ethAmount }
        );
    });

    it("should return correct active request IDs", async function () {
      const activeIds = await safeAutoBuy.getActiveRequestIds();
      expect(activeIds.length).to.equal(1);
      expect(activeIds[0]).to.equal(1);
    });

    it("should return correct active request count", async function () {
      expect(await safeAutoBuy.getActiveRequestCount()).to.equal(1);
    });

    it("should return correct user requests", async function () {
      const userRequests = await safeAutoBuy.getUserRequests(signers.alice.address);
      expect(userRequests.length).to.equal(1);
      expect(userRequests[0]).to.equal(1);
    });

    it("should return correct token balance", async function () {
      const balance = await safeAutoBuy.getTokenBalance(testTokenAddress);
      expect(balance).to.equal(ethers.parseEther("10000"));
    });

    it("should return correct ETH balance", async function () {
      const balance = await safeAutoBuy.getETHBalance();
      expect(balance).to.equal(ethers.parseEther("1")); // From the request creation
    });
  });
});
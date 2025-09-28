import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact with SafeAutoBuy
 * ===============================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the contracts
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the SafeAutoBuy contract
 *
 *   npx hardhat --network localhost task:safeautobuy-address
 *   npx hardhat --network localhost task:create-purchase-request --token 0x... --amount 1000 --eth 0.1
 *   npx hardhat --network localhost task:get-active-requests
 *   npx hardhat --network localhost task:process-random-request --seed 12345
 *   npx hardhat --network localhost task:get-user-requests --user 0x...
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:safeautobuy-address
 *   - npx hardhat --network sepolia task:safeautobuy-address
 */
task("task:safeautobuy-address", "Prints the SafeAutoBuy contract address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const safeAutoBuy = await deployments.get("SafeAutoBuy");
    const testToken = await deployments.get("TestToken");

    console.log("SafeAutoBuy address:", safeAutoBuy.address);
    console.log("TestToken address:", testToken.address);
  }
);

/**
 * Example:
 *   - npx hardhat --network localhost task:create-purchase-request --token 0x... --amount 1000 --eth 0.1
 *   - npx hardhat --network sepolia task:create-purchase-request --token 0x... --amount 1000 --eth 0.1
 */
task("task:create-purchase-request", "Create a new purchase request")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .addParam("token", "Token address to purchase")
  .addParam("amount", "Amount of tokens to purchase")
  .addParam("eth", "ETH amount to deposit")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const tokenAddress = taskArguments.token;
    const amount = parseInt(taskArguments.amount);
    const ethAmount = taskArguments.eth;

    if (!Number.isInteger(amount)) {
      throw new Error(`Argument --amount is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const signers = await ethers.getSigners();
    const user = signers[0];

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);

    // Create encrypted input for token address and amount
    const encryptedInput = await fhevm
      .createEncryptedInput(SafeAutoBuyDeployment.address, user.address)
      .addAddress(tokenAddress)
      .add32(amount)
      .encrypt();

    const tx = await safeAutoBuyContract
      .connect(user)
      .createPurchaseRequest(
        encryptedInput.handles[0], // encrypted token address
        encryptedInput.handles[1], // encrypted amount
        encryptedInput.inputProof,
        { value: ethers.parseEther(ethAmount) }
      );

    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Purchase request created successfully!`);
    console.log(`Token: ${tokenAddress}`);
    console.log(`Amount: ${amount}`);
    console.log(`ETH deposited: ${ethAmount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-active-requests
 *   - npx hardhat --network sepolia task:get-active-requests
 */
task("task:get-active-requests", "Get all active purchase requests")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);

    const activeRequestIds = await safeAutoBuyContract.getActiveRequestIds();
    console.log(`Active requests count: ${activeRequestIds.length}`);

    for (let i = 0; i < activeRequestIds.length; i++) {
      const requestId = activeRequestIds[i];
      const request = await safeAutoBuyContract.purchaseRequests(requestId);

      console.log(`Request ID: ${requestId}`);
      console.log(`  User: ${request.user}`);
      console.log(`  ETH Deposited: ${ethers.formatEther(request.ethDeposited)} ETH`);
      console.log(`  Timestamp: ${new Date(Number(request.timestamp) * 1000).toISOString()}`);
      console.log(`  Active: ${request.isActive}`);
      console.log("---");
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:process-random-request --seed 12345
 *   - npx hardhat --network sepolia task:process-random-request --seed 12345
 */
task("task:process-random-request", "Process a random purchase request (owner only)")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .addParam("seed", "Random seed for request selection")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const seed = parseInt(taskArguments.seed);
    if (!Number.isInteger(seed)) {
      throw new Error(`Argument --seed is not an integer`);
    }

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const signers = await ethers.getSigners();
    const owner = signers[0]; // Assuming first signer is owner

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);

    const activeCount = await safeAutoBuyContract.getActiveRequestCount();
    if (activeCount === 0n) {
      console.log("No active requests to process");
      return;
    }

    console.log(`Processing random request from ${activeCount} active requests...`);

    const tx = await safeAutoBuyContract.connect(owner).selectRandomRequest(seed);
    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Random request processing initiated with seed: ${seed}`);
    console.log("Note: Decryption and execution will happen via oracle callback");
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-user-requests --user 0x...
 *   - npx hardhat --network sepolia task:get-user-requests --user 0x...
 */
task("task:get-user-requests", "Get purchase requests for a specific user")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .addParam("user", "User address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const userAddress = taskArguments.user;

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);

    const userRequestIds = await safeAutoBuyContract.getUserRequests(userAddress);
    console.log(`User ${userAddress} has ${userRequestIds.length} requests:`);

    for (let i = 0; i < userRequestIds.length; i++) {
      const requestId = userRequestIds[i];
      const request = await safeAutoBuyContract.purchaseRequests(requestId);

      console.log(`Request ID: ${requestId}`);
      console.log(`  ETH Deposited: ${ethers.formatEther(request.ethDeposited)} ETH`);
      console.log(`  Timestamp: ${new Date(Number(request.timestamp) * 1000).toISOString()}`);
      console.log(`  Active: ${request.isActive}`);
      console.log("---");
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-user-data --requestid 1
 *   - npx hardhat --network sepolia task:decrypt-user-data --requestid 1
 */
task("task:decrypt-user-data", "Decrypt encrypted data for a user's request")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .addParam("requestid", "Request ID to decrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const requestId = parseInt(taskArguments.requestid);
    if (!Number.isInteger(requestId)) {
      throw new Error(`Argument --requestid is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const signers = await ethers.getSigners();
    const user = signers[0];

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);

    // Get encrypted token address and amount
    const encryptedTokenAddress = await safeAutoBuyContract.getEncryptedTokenAddress(requestId);
    const encryptedAmount = await safeAutoBuyContract.getEncryptedAmount(requestId);

    console.log(`Request ID: ${requestId}`);
    console.log(`Encrypted token address: ${encryptedTokenAddress}`);
    console.log(`Encrypted amount: ${encryptedAmount}`);

    try {
      // Decrypt the values (only works if user has proper ACL permissions)
      const clearTokenAddress = await fhevm.userDecryptEaddress(
        FhevmType.eaddress,
        encryptedTokenAddress,
        SafeAutoBuyDeployment.address,
        user
      );
      console.log(`Clear token address: ${clearTokenAddress}`);

      const clearAmount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedAmount,
        SafeAutoBuyDeployment.address,
        user
      );
      console.log(`Clear amount: ${clearAmount}`);
    } catch (error) {
      console.log("Could not decrypt data - user may not have proper permissions");
      console.error(error);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:cancel-request --requestid 1
 *   - npx hardhat --network sepolia task:cancel-request --requestid 1
 */
task("task:cancel-request", "Cancel a purchase request")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .addParam("requestid", "Request ID to cancel")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const requestId = parseInt(taskArguments.requestid);
    if (!Number.isInteger(requestId)) {
      throw new Error(`Argument --requestid is not an integer`);
    }

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const signers = await ethers.getSigners();
    const user = signers[0];

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);

    const tx = await safeAutoBuyContract.connect(user).cancelRequest(requestId);
    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Request ${requestId} cancelled successfully!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:deposit-tokens --token 0x... --amount 1000
 *   - npx hardhat --network sepolia task:deposit-tokens --token 0x... --amount 1000
 */
task("task:deposit-tokens", "Deposit tokens to SafeAutoBuy contract (owner only)")
  .addOptionalParam("address", "Optionally specify the SafeAutoBuy contract address")
  .addParam("token", "Token address")
  .addParam("amount", "Amount to deposit")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const tokenAddress = taskArguments.token;
    const amount = taskArguments.amount;

    const SafeAutoBuyDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SafeAutoBuy");
    console.log(`SafeAutoBuy: ${SafeAutoBuyDeployment.address}`);

    const signers = await ethers.getSigners();
    const owner = signers[0];

    const safeAutoBuyContract = await ethers.getContractAt("SafeAutoBuy", SafeAutoBuyDeployment.address);
    const tokenContract = await ethers.getContractAt("TestToken", tokenAddress);

    // First approve the SafeAutoBuy contract to spend tokens
    const approveTx = await tokenContract.connect(owner).approve(SafeAutoBuyDeployment.address, ethers.parseEther(amount));
    await approveTx.wait();
    console.log("Approval transaction completed");

    // Then deposit tokens
    const tx = await safeAutoBuyContract.connect(owner).depositTokens(tokenAddress, ethers.parseEther(amount));
    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log(`Deposited ${amount} tokens to SafeAutoBuy contract`);
  });
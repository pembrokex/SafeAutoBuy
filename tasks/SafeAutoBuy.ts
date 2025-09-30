import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("safebuy:address", "Prints the SafeAutoBuy address").setAction(async (args: TaskArguments, hre) => {
  const dep = await hre.deployments.get("SafeAutoBuy");
  console.log(`SafeAutoBuy: ${dep.address}`);
});

task("safebuy:set-price", "Set fixed price for a token (wei per token)")
  .addParam("token", "Token address")
  .addParam("price", "Price in wei per token")
  .setAction(async (args: TaskArguments, hre) => {
    const { token, price } = args as { token: string; price: string };
    const { ethers, deployments } = hre;
    const dep = await deployments.get("SafeAutoBuy");
    const sb = await ethers.getContractAt("SafeAutoBuy", dep.address);
    const tx = await sb.setPrice(token, price);
    console.log(`Wait for tx: ${tx.hash}...`);
    const rc = await tx.wait();
    console.log(`status=${rc?.status}`);
  });

task("safebuy:submit", "Submit an order")
  .addParam("token", "Desired token address")
  .addParam("amount", "Desired token amount (uint32)")
  .setAction(async (args: TaskArguments, hre) => {
    const { token, amount } = args as { token: string; amount: string };
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const dep = await deployments.get("SafeAutoBuy");
    const signers = await ethers.getSigners();
    const sb = await ethers.getContractAt("SafeAutoBuy", dep.address);

    const input = await fhevm.createEncryptedInput(dep.address, signers[0].address).addAddress(token).add32(parseInt(amount)).encrypt();

    const tx = await sb
      .connect(signers[0])
      .submitOrder(input.handles[0], input.handles[1], input.inputProof);
    console.log(`Wait for tx: ${tx.hash}...`);
    const rc = await tx.wait();
    console.log(`status=${rc?.status}`);
  });

task("safebuy:deposit", "Deposit ETH to SafeAutoBuy balance")
  .addParam("eth", "Amount in ETH")
  .setAction(async (args: TaskArguments, hre) => {
    const { eth } = args as { eth: string };
    const { ethers, deployments } = hre;
    const dep = await deployments.get("SafeAutoBuy");
    const sb = await ethers.getContractAt("SafeAutoBuy", dep.address);
    const tx = await sb.depositETH({ value: ethers.parseEther(eth) });
    console.log(`Wait for tx: ${tx.hash}...`);
    const rc = await tx.wait();
    console.log(`status=${rc?.status}`);
  });

task("safebuy:withdraw", "Withdraw ETH from SafeAutoBuy balance")
  .addParam("eth", "Amount in ETH")
  .setAction(async (args: TaskArguments, hre) => {
    const { eth } = args as { eth: string };
    const { ethers, deployments } = hre;
    const dep = await deployments.get("SafeAutoBuy");
    const sb = await ethers.getContractAt("SafeAutoBuy", dep.address);
    const tx = await sb.withdrawETH(ethers.parseEther(eth));
    console.log(`Wait for tx: ${tx.hash}...`);
    const rc = await tx.wait();
    console.log(`status=${rc?.status}`);
  });

task("safebuy:pick", "Owner picks random order and requests decryption").setAction(async (_args: TaskArguments, hre) => {
  const { ethers, deployments } = hre;
  const dep = await deployments.get("SafeAutoBuy");
  const sb = await ethers.getContractAt("SafeAutoBuy", dep.address);
  const tx = await sb.pickRandomAndRequestDecryption();
  console.log(`Wait for tx: ${tx.hash}...`);
  const rc = await tx.wait();
  console.log(`status=${rc?.status}`);
});

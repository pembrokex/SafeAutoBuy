import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy TestToken
  const deployedTestToken = await deploy("TestToken", {
    from: deployer,
    args: [
      "Test Token",           // name
      "TEST",                // symbol
      18,                    // decimals
      ethers.parseEther("1000000"), // initial supply: 1M tokens
      deployer               // initial owner
    ],
    log: true,
  });
  console.log(`TestToken contract: `, deployedTestToken.address);

  // Deploy SafeAutoBuy
  const deployedSafeAutoBuy = await deploy("SafeAutoBuy", {
    from: deployer,
    args: [deployer],
    log: true,
  });
  console.log(`SafeAutoBuy contract: `, deployedSafeAutoBuy.address);

  // Initialize SafeAutoBuy with some test tokens
  if (hre.network.name !== "hardhat") {
    console.log("Transferring test tokens to SafeAutoBuy contract...");
    const testToken = await ethers.getContractAt("TestToken", deployedTestToken.address);
    const transferAmount = ethers.parseEther("10000"); // 10k tokens
    const tx = await testToken.transfer(deployedSafeAutoBuy.address, transferAmount);
    await tx.wait();
    console.log(`Transferred ${ethers.formatEther(transferAmount)} TEST tokens to SafeAutoBuy`);

    // Set a fixed price for TEST token (e.g., 0.0001 ETH per token)
    const safeAutoBuy = await ethers.getContractAt("SafeAutoBuy", deployedSafeAutoBuy.address);
    const setPriceTx = await safeAutoBuy.setPrice(deployedTestToken.address, ethers.parseEther("0.0001"));
    await setPriceTx.wait();
    console.log(`Set price for TEST token to 0.0001 ETH`);
  }
};

export default func;
func.id = "deploy_safeAutoBuy"; // id required to prevent reexecution
func.tags = ["SafeAutoBuy", "TestToken", "FHECounter"];

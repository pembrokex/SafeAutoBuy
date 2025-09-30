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
  // Deploy TestToken2 (TEST2)
  const deployedTestToken2 = await deploy("TestToken", {
    from: deployer,
    args: [
      "Test Token 2",           // name
      "TEST2",                // symbol
      18,                    // decimals
      ethers.parseEther("1000000"), // initial supply: 1M tokens
      deployer               // initial owner
    ],
    log: true,
  });
  console.log(`TestToken2 contract: `, deployedTestToken2.address);

  // Deploy SafeAutoBuy
  const deployedSafeAutoBuy = await deploy("SafeAutoBuy", {
    from: deployer,
    args: [deployer],
    log: true,
  });
  console.log(`SafeAutoBuy contract: `, deployedSafeAutoBuy.address);

  // Initialize SafeAutoBuy with some test tokens and set prices

  console.log("Transferring test tokens to SafeAutoBuy contract...");
  const testToken = await ethers.getContractAt("TestToken", deployedTestToken.address);
  const testToken2 = await ethers.getContractAt("TestToken", deployedTestToken2.address);
  const transferAmount = ethers.parseEther("10000"); // 10k tokens each
  const tx = await testToken.transfer(deployedSafeAutoBuy.address, transferAmount);
  await tx.wait();
  console.log(`Transferred ${ethers.formatEther(transferAmount)} TEST tokens to SafeAutoBuy`);
  const tx2 = await testToken2.transfer(deployedSafeAutoBuy.address, transferAmount);
  await tx2.wait();
  console.log(`Transferred ${ethers.formatEther(transferAmount)} TEST2 tokens to SafeAutoBuy`);

  // Set fixed prices
  const safeAutoBuy = await ethers.getContractAt("SafeAutoBuy", deployedSafeAutoBuy.address);
  const setPriceTx1 = await safeAutoBuy.setPrice(deployedTestToken.address, ethers.parseEther("0.0001"));
  await setPriceTx1.wait();
  console.log(`Set price for TEST token to 0.0001 ETH`);
  const setPriceTx2 = await safeAutoBuy.setPrice(deployedTestToken2.address, ethers.parseEther("0.0002"));
  await setPriceTx2.wait();
  console.log(`Set price for TEST2 token to 0.0002 ETH`);

};

export default func;
func.id = "deploy_safeAutoBuy"; // id required to prevent reexecution
func.tags = ["SafeAutoBuy", "TestToken", "FHECounter"];

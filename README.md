# SafeAutoBuy

> A privacy-preserving decentralized token purchase platform powered by Zama's Fully Homomorphic Encryption (FHE)

SafeAutoBuy is an innovative blockchain application that enables users to purchase ERC20 tokens while maintaining complete privacy of their purchase intentions. Built on Ethereum using Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine), SafeAutoBuy ensures that token addresses and purchase amounts remain encrypted end-to-end, only revealed when the platform owner fulfills the order.

## 🌟 Overview

SafeAutoBuy transforms the token purchasing experience by introducing privacy-first mechanics into decentralized finance. Users submit encrypted purchase orders specifying which token they want and how much, deposit ETH to fund their purchases, and await fulfillment—all without revealing their trading intentions to anyone, including miners, validators, or front-runners.

### Key Features

- **🔒 Confidential Trading**: Token addresses and amounts are fully encrypted on-chain using FHE
- **🎲 Fair Order Selection**: Platform owner randomly selects pending orders for processing
- **💰 Fixed Price Model**: Predictable, transparent pricing without AMM slippage
- **⚡ On-Chain Decryption**: Zama Oracle decrypts orders securely for fulfillment
- **💳 Flexible Fund Management**: Users deposit/withdraw ETH balances at will
- **📊 Multi-Token Support**: Support for multiple ERC20 tokens with individual pricing
- **🎯 Order Lifecycle Management**: Complete order tracking from submission to fulfillment
- **🛡️ MEV Protection**: Encrypted orders prevent front-running and sandwich attacks
- **🔐 Privacy-Preserving**: No one knows what you're buying until order fulfillment

## 🎯 Problem Solved

Traditional decentralized exchanges and token purchase platforms expose several critical vulnerabilities:

1. **Front-Running**: Miners and bots can observe pending transactions and execute trades before you
2. **Sandwich Attacks**: Malicious actors place orders before and after yours to profit from price movement
3. **MEV Exploitation**: Maximum Extractable Value attacks drain user profits
4. **Privacy Leakage**: All trading intentions are visible on-chain before execution
5. **Price Manipulation**: Large orders can be detected and exploited
6. **Strategic Disadvantage**: Competitors and adversaries can monitor your trading patterns

SafeAutoBuy solves these problems by:

- Encrypting purchase orders completely (token + amount)
- Preventing transaction analysis and pattern detection
- Using random order selection to prevent gaming
- Decrypting only at fulfillment time through trusted Zama Oracle
- Providing fixed prices to eliminate front-running incentives
- Enabling confidential trading strategies for institutions and individuals

## 🏗️ Architecture

SafeAutoBuy consists of three main components:

### 1. Smart Contracts (Solidity + FHEVM)

#### **SafeAutoBuy.sol**
The core contract that manages encrypted orders, ETH deposits, and order fulfillment.

**Key Features:**
- Encrypted order submission using `eaddress` and `euint32` types
- ETH balance management (deposit/withdraw)
- Random order selection and decryption request
- Decryption callback for order fulfillment
- Fixed price configuration per token
- Comprehensive order lifecycle tracking (Pending → Processing → Completed/Failed/Canceled)

**Order Flow:**
1. User submits encrypted order with token address and amount
2. ETH is deposited to user's contract balance
3. Owner randomly picks a pending order
4. Contract requests decryption from Zama Oracle
5. Oracle decrypts and calls back with plaintext values
6. Contract validates, deducts ETH, and transfers tokens
7. Order marked as completed or failed with detailed events

#### **TestToken.sol**
ERC20 test token implementation for platform testing and demonstration.

**Features:**
- Standard ERC20 functionality
- Configurable decimals
- Minting and burning capabilities
- Used for TEST and TEST2 demonstration tokens

### 2. Frontend Application (React + Wagmi + Vite)

Modern, responsive web interface built with React 19 and TypeScript.

**Components:**

- **SubmitOrder**: Users create encrypted purchase orders
  - Token selection (TEST/TEST2)
  - Amount input (uint32 encrypted)
  - Real-time pending order count
  - Transaction hash display

- **Assets**: Balance and fund management
  - View deposited ETH balance
  - View wallet token balances
  - Deposit ETH to contract
  - Withdraw ETH from contract

- **OwnerPanel**: Administrative controls
  - Set fixed prices for tokens
  - Pick random order for processing
  - View pending order statistics

- **Instructions**: User guide and documentation

**Technology Stack:**
- React 19 with TypeScript
- Wagmi + Viem for Ethereum interactions
- RainbowKit for wallet connection
- TanStack Query for state management
- Zama FHE Relayer SDK for encryption
- Ethers.js v6 for contract interaction
- Vite for build tooling

### 3. Development Environment (Hardhat)

Complete testing and deployment infrastructure.

**Features:**
- FHEVM mock environment for local testing
- Hardhat deployment scripts
- Comprehensive test suites
- Network configurations (localhost, Sepolia)
- Contract verification support
- Gas reporting
- TypeChain type generation

## 🔧 Technology Stack

### Blockchain & Encryption
- **FHEVM (Zama)**: Fully Homomorphic Encryption for Ethereum smart contracts
- **Solidity 0.8.27**: Smart contract programming language
- **OpenZeppelin Contracts v5.4.0**: Battle-tested smart contract libraries
- **Zama Oracle**: Decentralization oracle for secure on-chain decryption

### Frontend
- **React 19**: Modern UI library with latest features
- **TypeScript 5.8**: Type-safe development
- **Wagmi v2.17**: React hooks for Ethereum
- **Viem v2.37**: TypeScript-first Ethereum library
- **RainbowKit v2.2**: Beautiful wallet connection UI
- **Ethers.js v6.15**: Ethereum wallet implementation
- **TanStack Query v5**: Powerful async state management
- **Vite v7**: Next-generation frontend tooling

### Development Tools
- **Hardhat v2.26**: Ethereum development environment
- **TypeChain v8**: TypeScript bindings for contracts
- **Hardhat Deploy**: Deployment management plugin
- **Mocha + Chai**: Testing framework
- **ESLint + Prettier**: Code quality and formatting
- **Solhint**: Solidity linter
- **Hardhat Gas Reporter**: Gas usage analysis

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Wallet**: MetaMask or compatible Web3 wallet
- **Testnet ETH**: Sepolia testnet ETH for deployment and testing

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/SafeAutoBuy.git
   cd SafeAutoBuy
   ```

2. **Install backend dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd app
   npm install
   cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```bash
   # Required for deployment
   PRIVATE_KEY=your_private_key_here
   MNEMONIC=your_mnemonic_phrase_here

   # Required for Sepolia deployment
   INFURA_API_KEY=your_infura_api_key

   # Optional: for contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Compilation and Testing

1. **Compile smart contracts**

   ```bash
   npm run compile
   ```

2. **Run tests (local mock FHEVM)**

   ```bash
   npm test
   ```

3. **Run tests on Sepolia**

   ```bash
   npm run test:sepolia
   ```

4. **Generate coverage report**

   ```bash
   npm run coverage
   ```

### Deployment

#### Local Development Network

1. **Start local Hardhat node**

   ```bash
   npm run chain
   ```

2. **Deploy contracts (in new terminal)**

   ```bash
   npm run deploy:localhost
   ```

   This will deploy:
   - SafeAutoBuy contract
   - TestToken (TEST) with 1M initial supply
   - TestToken (TEST2) with 1M initial supply
   - Transfer 10K tokens of each to SafeAutoBuy
   - Set initial prices (0.0001 ETH for TEST, 0.0002 ETH for TEST2)

#### Sepolia Testnet

1. **Ensure you have Sepolia ETH**

   Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

2. **Deploy to Sepolia**

   ```bash
   npm run deploy:sepolia
   ```

3. **Verify contracts on Etherscan**

   ```bash
   npm run verify:sepolia
   ```

4. **Update frontend configuration**

   After deployment, update `app/src/config/contracts.ts` with the deployed contract address.

### Running the Frontend

1. **Navigate to frontend directory**

   ```bash
   cd app
   ```

2. **Start development server**

   ```bash
   npm run dev
   ```

3. **Open in browser**

   Visit `http://localhost:5173` (or the port shown in terminal)

4. **Connect your wallet**

   - Click "Connect Wallet" button
   - Select MetaMask or your preferred wallet
   - Ensure you're connected to Sepolia testnet (or localhost for local development)

5. **Build for production**

   ```bash
   npm run build
   npm run preview
   ```

## 📖 Usage Guide

### For Users

1. **Deposit ETH**
   - Navigate to "Assets" tab
   - Enter amount in ETH
   - Click "Deposit" and confirm transaction
   - Wait for confirmation

2. **Submit a Purchase Order**
   - Navigate to "Submit Order" tab
   - Select token (TEST or TEST2)
   - Enter amount (integer, will be encrypted)
   - Click "Submit Order" and confirm transaction
   - Your order is now encrypted and pending

3. **Check Order Status**
   - View pending order count on Submit Order page
   - Monitor your assets on Assets tab
   - Wait for owner to process your order

4. **Withdraw ETH**
   - Navigate to "Assets" tab
   - Enter amount to withdraw
   - Click "Withdraw" and confirm
   - ETH will be returned to your wallet

### For Platform Owner

1. **Set Token Prices**
   - Navigate to "Owner Panel" tab
   - Enter token contract address
   - Enter price in ETH per token
   - Click "Set Price" and confirm transaction

2. **Process Orders**
   - Ensure SafeAutoBuy contract has token inventory
   - Navigate to "Owner Panel" tab
   - Click "Pick Random Order"
   - Contract will randomly select a pending order
   - Zama Oracle decrypts the order
   - Contract automatically fulfills if user has sufficient ETH
   - User receives tokens, ETH is deducted

3. **Fund Contract Inventory**
   ```bash
   # Transfer tokens to contract for fulfillment
   # Using Hardhat task:
   npx hardhat transfer-tokens --token <TOKEN_ADDRESS> --to <SAFEAUTOBUY_ADDRESS> --amount <AMOUNT>
   ```

## 🎓 How It Works

### Encryption Process

1. **User Input**: User selects token and amount in frontend
2. **Client-Side Encryption**: Zama FHE SDK encrypts values locally
3. **Proof Generation**: SDK generates zero-knowledge proof of encryption
4. **Transaction Submission**: Encrypted handles + proof sent to contract
5. **On-Chain Storage**: Contract stores encrypted values as `eaddress` and `euint32`

### Order Processing

1. **Random Selection**: Owner calls `pickRandomAndRequestDecryption()`
2. **Pseudo-Random Algorithm**: Uses `block.prevrandao` + timestamp + count
3. **Decryption Request**: Contract calls Zama Oracle with encrypted values
4. **Oracle Decryption**: Zama Oracle decrypts using secure threshold cryptography
5. **Callback Execution**: Oracle calls `decryptionCallback()` with plaintext values
6. **Signature Verification**: Contract validates oracle signatures
7. **Order Fulfillment**: Contract checks balance, transfers tokens, deducts ETH
8. **Event Emission**: `OrderCompleted` event with order details

### Security Guarantees

- **Confidentiality**: Encrypted values never exposed until decryption
- **Integrity**: Zero-knowledge proofs ensure valid encryptions
- **Authenticity**: Oracle signatures verify legitimate decryption
- **Non-Repudiation**: All actions logged with events
- **Access Control**: Owner-only functions protected with Ownable pattern
- **Reentrancy Protection**: Standard OpenZeppelin patterns used

## 💡 Use Cases

### Individual Traders
- **Privacy Protection**: Buy tokens without revealing strategy
- **Front-Running Defense**: Prevent MEV bots from exploiting trades
- **Confidential Accumulation**: Build positions without market impact

### Institutional Investors
- **Strategic Privacy**: Hide large purchases from competitors
- **Regulatory Compliance**: Maintain transaction privacy where required
- **Competitive Advantage**: Execute strategies without information leakage

### Privacy-Conscious Users
- **Financial Privacy**: Keep trading activity confidential
- **Pattern Protection**: Prevent behavior analysis and profiling
- **Identity Protection**: Trade without linking to real-world identity

### DeFi Protocols
- **Treasury Management**: Execute treasury operations privately
- **Liquidity Provisioning**: Add liquidity without revealing strategy
- **Governance Actions**: Accumulate governance tokens discreetly

## 🔮 Future Roadmap

### Phase 1: Enhanced Features (Q2 2025)
- [ ] Support for limit orders with encrypted price thresholds
- [ ] Time-locked orders with scheduled execution
- [ ] Batch order processing for efficiency
- [ ] Order cancellation refund mechanism
- [ ] Multi-token bundle orders

### Phase 2: Advanced Privacy (Q3 2025)
- [ ] Private order history per user
- [ ] Encrypted price discovery mechanism
- [ ] Anonymous user identifiers (zkSNARK integration)
- [ ] Private balance queries
- [ ] Confidential transaction history

### Phase 3: Ecosystem Integration (Q4 2025)
- [ ] Integration with DEX aggregators
- [ ] Cross-chain bridge support
- [ ] Layer 2 deployment (Arbitrum, Optimism)
- [ ] Mobile application (iOS/Android)
- [ ] API for programmatic trading
- [ ] Liquidity provider incentive program

### Phase 4: Decentralization (Q1 2026)
- [ ] Decentralized order matching
- [ ] DAO governance for platform parameters
- [ ] Distributed oracle network
- [ ] Stake-based fulfillment system
- [ ] Community-driven token listing

### Phase 5: Enterprise Features (Q2 2026)
- [ ] Institutional API with rate limits
- [ ] Compliance and reporting tools
- [ ] Multi-signature treasury management
- [ ] Advanced analytics dashboard
- [ ] White-label deployment options
- [ ] OTC trading desk integration

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Implement your feature or fix
4. **Write tests**: Ensure comprehensive test coverage
5. **Run linting**: `npm run lint` (fix issues with `npm run prettier:write`)
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open Pull Request**: Describe your changes and why they're needed

### Contribution Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Add tests for all new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep PRs focused on single features/fixes

### Areas for Contribution

- 🐛 Bug fixes and issue resolution
- ✨ New features and enhancements
- 📝 Documentation improvements
- 🧪 Additional test coverage
- 🎨 UI/UX improvements
- 🌍 Internationalization and translations
- ⚡ Performance optimizations
- 🔒 Security audits and improvements

## 🔐 Security

### Security Considerations

- All encrypted values stored on-chain are confidential
- Zama Oracle provides secure decryption with threshold cryptography
- OpenZeppelin contracts for battle-tested security patterns
- No private keys or sensitive data stored in frontend
- All transactions require user signature
- Owner cannot manipulate random selection (uses block state)

### Reporting Security Issues

If you discover a security vulnerability, please do NOT open a public issue. Instead:

1. Email security@yourproject.com with details
2. Include steps to reproduce the vulnerability
3. Allow 90 days for fix before public disclosure
4. We will acknowledge receipt within 24 hours

### Audit Status

- ⏳ Smart contract audit: **Pending** (scheduled Q2 2025)
- ⏳ Frontend security review: **Pending**
- ⏳ FHEVM integration review: **Pending**

## 📚 Additional Resources

### Documentation
- [FHEVM Documentation](https://docs.zama.ai/fhevm) - Zama's official FHEVM docs
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat) - Hardhat integration guide
- [Wagmi Documentation](https://wagmi.sh/) - React hooks for Ethereum
- [RainbowKit Documentation](https://www.rainbowkit.com/) - Wallet connection UI

### Tutorials
- [FHEVM Quick Start](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [Writing FHE Contracts](https://docs.zama.ai/protocol/solidity-guides/development-guide)
- [Testing FHE Contracts](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

### Community
- [Zama Discord](https://discord.gg/zama) - Join the Zama community
- [Zama Twitter](https://twitter.com/zama_fhe) - Latest updates
- [GitHub Discussions](https://github.com/yourusername/SafeAutoBuy/discussions) - Project discussions

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

Key points:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No patent grant
- ⚠️ Clear clause: No patent rights granted

## 🙏 Acknowledgments

- **Zama** - For pioneering FHEVM technology and making confidential smart contracts possible
- **OpenZeppelin** - For secure, audited smart contract libraries
- **Hardhat Team** - For excellent Ethereum development tools
- **Wagmi & RainbowKit** - For making wallet integration seamless
- **Ethereum Community** - For continuous innovation in decentralized systems

## 📞 Contact & Support

### Get Help
- 📧 Email: support@safeautobuy.com
- 💬 Discord: [Join our Discord](https://discord.gg/safeautobuy)
- 🐦 Twitter: [@SafeAutoBuy](https://twitter.com/safeautobuy)
- 📚 Documentation: [docs.safeautobuy.com](https://docs.safeautobuy.com)

### Report Issues
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/SafeAutoBuy/issues)
- 💡 Feature Requests: [GitHub Discussions](https://github.com/yourusername/SafeAutoBuy/discussions)
- 🔒 Security Issues: security@safeautobuy.com

---

**Built with ❤️ and 🔐 by the SafeAutoBuy Team**

*Empowering privacy-preserving DeFi, one encrypted transaction at a time.*
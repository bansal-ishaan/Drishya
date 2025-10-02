# 🎬 CineVault – Decentralized Film Distribution Platform

CineVault is a **next-generation decentralized film distribution and rental platform** built on the **Camp Blockchain**.  
It reshapes the relationship between filmmakers and their audience by **removing centralized intermediaries**, ensuring **fair monetization**, and offering a **censorship-resistant home** for creative work.

---

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Powered by: Camp Blockchain](https://img.shields.io/badge/Powered%20by-Camp%20Blockchain-22d3ee)
![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)

---

## 🌟 The Problem

The modern digital media landscape is dominated by centralized platforms that act as **powerful gatekeepers**.  
This creates a severe **power imbalance** for independent creators:

- **💸 Extractive Fees** – Platforms often take **30–55%** of revenue with **opaque, delayed payments**.
- **🚫 Censorship & Loss of Control** – Arbitrary “community guidelines” can **deplatform** creators without recourse.
- **🛑 High Barriers to Entry** – Securing distribution deals is a **major hurdle** for many talented filmmakers.
- **⚠ Platform Risk** – Sudden changes in terms of service can **destroy a creator’s livelihood** overnight.

---

## ✨ The CineVault Solution

CineVault solves these problems by leveraging **Web3 technology** and the **Camp Blockchain**:

| Feature | Benefit |
|---------|---------|
| **🎥 Creator Sovereignty** | Immutable smart contracts remove CineVault as the intermediary. |
| **⚡ Fair & Instant Payments** | 90% of rental revenue paid instantly to creators’ wallets. |
| **🛡 Censorship Resistance** | Films stored on IPFS via Camp Origin SDK – resilient & tamper-proof. |
| **🌍 Permissionless Access** | Anyone can upload films and monetize globally. |

---

## 🚀 Key Features

- **Dual-Portal Architecture**
  - 🎬 **Creator Portal** – Upload films, manage profiles, track on-chain earnings in real time.
  - 🍿 **Viewer Portal** – Discover, rent, and watch indie films with a **modern streaming experience**.

- **Web3-First Design**
  - Decentralized storage (IPFS + Pinata fallback)
  - Automated smart contract rental lifecycle
  - Wallet-based identity (MetaMask, RainbowKit)

- **Modern UI/UX**
  - Built with **Next.js**, **Tailwind CSS**, **Framer Motion**, **shadcn/ui**
  - Fully **responsive** and **mobile-friendly**

---

## 🛠 Tech Stack & Tools

**Frontend**
- Framework: `Next.js (React)`
- Styling: `Tailwind CSS`
- UI Components: `shadcn/ui`
- Animations: `Framer Motion`

**Web3 Integration**
- Blockchain: `Camp Blockchain`
- Wallet: `RainbowKit`
- Contract Interaction: `wagmi`, `viem`

**Smart Contract**
- Language: `Solidity`
- Dev Environment: `Hardhat` / `Foundry`

**Storage**
- Primary: `Camp Origin SDK (IPFS)`
- Fallback: `Pinata`

**Deployment**
- Platform: `Vercel`

---

## 🏁 Getting Started

### 📋 Prerequisites
- Node.js v18+  
- `pnpm` / `npm` / `yarn`  
- Web3 wallet (e.g., MetaMask)

### 📦 Installation
```bash
# Clone the repository
git clone https://github.com/your-username/cinevault.git
cd cinevault

# Install dependencies
pnpm install

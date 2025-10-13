# 🎟️ Tikitichain — Blockchain-Based Ticketing Platform

<div align="center">

**Secure, Transparent, Fraud-Proof Event Ticketing**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Blockchain-blue)](https://ethereum.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[Features](#-key-features) • [Documentation](#-documentation) • [Installation](#️-installation--setup)

</div>

---

## 📖 Overview

**Tikitichain** is a next-generation blockchain-based mobile and web ticketing platform designed to eliminate ticket fraud, unregulated resales, and revenue loss for event organizers. By leveraging **blockchain technology**, **smart contracts**, and **NFT standards**, Tikitichain ensures that every ticket is **secure**, **verifiable**, and **traceable** from issuance to entry.

Each ticket is minted as a **unique NFT (ERC-721)** on the Ethereum blockchain. Smart contracts handle purchasing rules, resale limits, and automated revenue distribution—making fraud and scalping virtually impossible while maintaining transparency and trust throughout the ticketing lifecycle.

### 🎯 Problem Statement

The traditional ticketing industry faces critical challenges:
- **Ticket Fraud**: Counterfeit tickets cost the industry billions annually
- **Scalping & Price Gouging**: Secondary market manipulation hurts genuine fans
- **Revenue Leakage**: Organizers lose up to 30% of potential revenue to unauthorized resales
- **Lack of Transparency**: No visibility into ticket ownership chain
- **High Fees**: Centralized platforms charge excessive service fees

### 💡 Our Solution

Tikitichain addresses these challenges through:
- Blockchain-based immutable ticket records
- Smart contract-enforced resale policies
- Direct peer-to-peer transfers with automated royalties
- Transparent ownership history
- Reduced intermediary costs

---

## 🚀 Key Features

### For Attendees
- 🔒 **Blockchain Security** – Every ticket is an NFT guaranteeing authenticity
- 📱 **Mobile Wallet** – Store and manage tickets in your personal blockchain wallet
- 🔄 **Secure Transfers** – Safely transfer or resell tickets with built-in protections
- 🧾 **QR Verification** – Instant entry validation at events
- 🎯 **Event Discovery** – Personalized recommendations based on preferences
- 📊 **Purchase History** – Complete transaction transparency
- 💬 **Social Features** – Connect with other attendees, share experiences

### For Organizers
- ⚙️ **Event Management** – Create and manage events with custom parameters
- 💸 **Revenue Control** – Set resale limits and earn royalties on secondary sales
- 📈 **Analytics Dashboard** – Real-time sales tracking and audience insights
- 🎨 **Custom Branding** – Design unique ticket NFTs with event artwork
- 🔐 **Fraud Prevention** – Eliminate counterfeit tickets permanently
- 💰 **Instant Settlements** – Automated payouts via smart contracts
- 👥 **Attendee Management** – Track check-ins and engagement metrics

### Technical Features
- ⚖️ **Smart Contract Enforcement** – Automated rules for sales, resales, and revenue
- 💸 **Integrated Payments** – Secure on-chain and fiat payment options
- 🌐 **Cross-Platform** – Seamless experience across mobile and web
- 🔗 **IPFS Storage** – Decentralized storage for ticket metadata

---

**Technologies:**
- **React Native (TypeScript)** – Cross-platform mobile development
- **Expo** – Development and build tooling
- **React Navigation** – Navigation management
- **Expo Camera** – QR code scanning
- **React Native QRCode SVG** – QR generation
- **AsyncStorage** – Local data persistence
- **Viem** – Blockchain interaction


## 🧠 Conceptual Framework

### User Journey Flow

```
┌─────────────┐
│   Visitor   │ (Browses events, no account required)
└──────┬──────┘
       │ Registration
       ↓
┌─────────────┐
│  Attendee   │ (Registered user with wallet)
└──────┬──────┘
       │ Purchase Ticket
       ↓
┌─────────────────────────────────┐
│ NFT Minted → Stored in Wallet   │
└─────────────┬───────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ↓             ↓
┌──────────┐   ┌──────────┐
│  Resell  │   │  Attend  │
└──────────┘   └────┬─────┘
                    │
                    ↓
              ┌──────────┐
              │ QR Scan  │
              └──────────┘
```

### Organizer Flow

```
┌─────────────┐
│  Organizer  │ (Register as organizer)
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│  Create Event   │ (Define event parameters)
└────────┬────────┘
         │
         ↓
┌──────────────────────┐
│  Deploy Smart Contract│ (Set rules and pricing)
└────────┬─────────────┘
         │
         ↓
┌────────────────┐
│  Publish Event │ (Make visible to attendees)
└────────┬───────┘
         │
         ↓
┌─────────────────┐
│  Monitor Sales  │ (Dashboard analytics)
└─────────────────┘
```

### Ticket Lifecycle

1. **Creation**: Organizer creates event and defines ticket parameters
2. **Minting**: NFT ticket minted upon purchase
3. **Ownership**: Ticket stored in buyer's blockchain wallet
4. **Transfer**: Optional resale with smart contract enforcement
5. **Validation**: QR code scanned at event entry
6. **Redemption**: Ticket marked as used on-chain
7. **Archive**: Historical record maintained permanently

---

## 🧱 Database Design

### Entity-Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Visitor  │──────▶│ Attendee │◀──────│  Ticket  │
└──────────┘       └──────────┘       └────┬─────┘
                                            │
                                            │
┌──────────┐       ┌──────────┐            │
│Organizer │──────▶│  Event   │────────────┘
└──────────┘       └────┬─────┘
                        │
                        ↓
                   ┌──────────────┐
                   │SmartContract │
                   └──────────────┘
```
---

## ⚙️ Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **bun**, **npm** or **yarn** (latest version)
- **Supabase**
- **Git**
- **Metamask** or compatible Web3 wallet
- **Expo CLI** (for mobile development)

Optional:
- **Docker** and **Docker Compose** (for containerized deployment)
- **Hardhat** (for smart contract development)

### 1. Clone Repository

```bash
git clone https://github.com/clairewachira/tikiti_chain.git
cd tikitichain
```

### 2. Environment Configuration

Create `.env` files in the respective directories:

#### React Native (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=1232423
EXPO_PUBLIC_SUPABASE_ANON_KEY=1232423
```


### 3. Install Dependencies

#### Mobile App
```bash
cd tikiti_chain
bun install
```
---


## 📖 Documentation

### Additional Resources

- **Architecture Documentation**: `/docs/architecture.md`
- **Smart Contract Specs**: `/docs/smart-contracts.md`
- **API Reference**: `/docs/api-reference.md`
- **User Guide**: `/docs/user-guide.md`
- **Organizer Guide**: `/docs/organizer-guide.md`
- **Mobile App Guide**: `/docs/mobile-app.md`

### Video Tutorials

- [Getting Started](https://youtube.com/tikitichain-tutorial-1)
- [Creating Your First Event](https://youtube.com/tikitichain-tutorial-2)
- [Buying and Transferring Tickets](https://youtube.com/tikitichain-tutorial-3)

---

## 🗺️ Roadmap

### Phase 1: MVP (Q4 2024) ✅
- [ ] Core ticketing functionality
- [ ] Basic NFT minting
- [ ] Mobile and web interfaces
- [ ] Smart contract deployment (Testnet)

### Phase 2: Enhanced Features (Q1 2025) 🚧
- [ ] Secondary marketplace
- [ ] Fiat payment integration
- [ ] Advanced analytics dashboard
- [ ] Social features and sharing
- [ ] Multi-language support

### Phase 3: Scale & Optimize (Q2 2025) 📋
- [ ] Layer 2 scaling solutions
- [ ] Advanced fraud detection
- [ ] AI-powered recommendations
- [ ] White-label solutions
- [ ] Mobile app optimization

</div>

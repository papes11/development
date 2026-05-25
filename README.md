# DeSocial - Proof-of-Attention Rewards

A decentralized social app that rewards users for their attention and engagement using Solana blockchain technology.

## 🚀 Features

- **Proof-of-Attention**: Earn points based on app usage time
- **Blockchain Integration**: Secure point tracking on Solana
- **Referral System**: Boost rewards through referrals
- **Web Application**: Progressive Web App (PWA) ready
- **Cryptographic Security**: Backend API with encrypted signatures

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **Web Technologies**: Progressive Web App (PWA)
- **Backend**: Vercel API Routes
- **Deployment**: Vercel (Auto-deploy from GitHub)

## 📱 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/desocial)

### 1. Fork & Deploy
1. Fork this repository
2. Connect to Vercel
3. Set environment variables (see below)
4. Deploy!

### 2. Environment Variables

Set these in your Vercel dashboard:

```bash
# Required: Your project mnemonic (12 words)
NEXT_PUBLIC_PROJECT_MNEMONIC=your twelve word mnemonic phrase goes here

# Required: Your global registry address
NEXT_PUBLIC_DESOCIAL_GLOBAL_ADDRESS=your-global-registry-address-here

# Backend secrets (generate random strings)
PROJECT_SECRET_KEY=your-super-secret-project-key-change-this
SIG_POINT_SECRET_KEY=your-sig-point-secret-key-change-this
```

## 🏗️ Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/desocial.git
cd desocial
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Mobile Development

### Android
```bash
npm run mobile:android
```

### iOS
```bash
npm run mobile:ios
```

## 🔐 Security

- Environment variables are automatically excluded from git
- Backend APIs use cryptographic signatures
- All sensitive data is encrypted
- CORS configured for mobile apps

## 📊 API Endpoints

- `POST /api/sign-memo` - Sign and decrypt user memos
- `POST /api/sig-point` - Sign points with boost calculation
- `GET /api/sig-point` - Verify cryptographic signatures

## 🎯 How It Works

1. **Usage Tracking**: Native mobile plugins track app usage
2. **Point Calculation**: 1 minute = 1 point + bonus points
3. **Blockchain Storage**: Points stored as encrypted memos on Solana
4. **Cryptographic Verification**: Backend signs all point transactions
5. **Referral Rewards**: Boost system for referrals and verification

## 🚀 Deployment

The app automatically deploys to Vercel when you push to the main branch.

### Manual Deployment
```bash
npm run deploy
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ for the decentralized future

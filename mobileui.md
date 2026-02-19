# DeSocial Mobile UI Guide

## 📱 App Overview

DeSocial is a mobile-first social points app with a premium glassmorphism design using purple gradients and dark themes optimized for OLED displays.

## 🚀 Welcome Screen

The first screen users see when opening DeSocial:

- **Background**: Dark gradient with subtle purple accents
- **Logo**: Centered DeSocial branding
- **Welcome Message**: "Welcome to DeSocial" with subtitle
- **Connect Wallet Button**: Large purple gradient button with rounded corners
- **Design**: Full-screen with glassmorphism card containing welcome content

## 🏠 Home Tab

The main dashboard showing user's total points and key stats:

### Points Display Card
- **Large Counter**: Shows total points (e.g., "1.07K") with purple gradient text effect
- **Background**: Glassmorphism card with purple gradient border
- **Layout**: Centered content with "Total Points" label above counter

### User Stats Section
- **Score Card**: Current user level/score with progress indicators
- **App Usage**: Connected apps and usage statistics
- **Achievement Badges**: Completed milestones with icons

### Quick Actions
- **Verify Account**: Purple button if not verified
- **Rescan**: Refresh blockchain data button
- **Profile Access**: User avatar/name in header

## 🎁 Claim Tab

Points claiming interface with multiple sections:

### Claimable vs Claimed Card
- **Split Display**: Shows claimable points vs already claimed
- **Claim Button**: Large purple gradient button when points available
- **Status**: "No points to claim" when claimable = 0

### Daily Tasks Section
Each task card contains:
- **Icon**: Social media platform icon (Twitter, etc.)
- **Title**: "Follow us on X", "Like our post"
- **Description**: Brief task explanation
- **Action Button**: 
  - **Verified Users**: "Claim 100pts" (purple)
  - **Unverified Users**: "Visit" (gray) - opens link only
- **Status**: Checkmark when completed

### Bonus Points Section
Achievement-based bonuses:
- **Connect Wallet**: +20 pts
- **Verify Account**: +40 pts  
- **Use Referral**: +40 pts
- **Refer Friends**: +50 pts each
- **Total Display**: Shows accumulated bonus points

### Buy Bonus Section
- **Limited Offer**: "Get 10,000 bonus points for $1"
- **Buy Button**: Yellow/orange gradient button
- **One-time Purchase**: Button shows "ALREADY PURCHASED" if bought
- **SOL Payment**: Calculates current SOL price for $1 USD

## 📊 Epochs Tab

Historical points and performance tracking:
- **Time Periods**: Weekly/monthly point summaries
- **Charts**: Visual representation of points earned over time
- **Leaderboards**: User ranking compared to others

## 👤 Profile Tab

User account management and referral system:

### User Header
- **Avatar**: User profile picture or default
- **Username**: Display name
- **Wallet Address**: Truncated public key
- **Verification Status**: Badge if account verified

### Referral System
- **Your Code**: User's 6-character referral code
- **Referral Stats**: Number of successful referrals
- **Invite Button**: Share referral code via social media
- **Check Code**: Input field to verify others' referral codes

### Account Actions
- **Verify Account**: Main verification button (if not verified)
- **Rescan**: Refresh blockchain data
- **Logout**: Disconnect wallet

## 🧭 Bottom Navigation

Fixed navigation bar with 4 tabs:
- **Home**: House icon - main dashboard
- **Claim**: Gift icon - points claiming
- **Epochs**: Calendar icon - historical data  
- **Profile**: User icon - account settings

### Navigation Design
- **Height**: 80px with safe area padding
- **Background**: Dark with blur effect and top border
- **Active State**: Purple gradient background with white icon
- **Inactive State**: Transparent with gray icon
- **Touch Targets**: 48x48px for each tab

## 🔔 Toast Notifications

Success and error messages appear above navigation:

### Positioning
- **Location**: Bottom-center, 100px above navigation bar
- **Width**: Full width with 16px margins, max 400px
- **Animation**: Slides up from bottom

### Toast Types
- **Success**: Purple-green gradient, "🎉 Successfully claimed 150 points!"
- **Error**: Purple-red gradient, "Please connect your wallet first"
- **Info**: Pure purple gradient for general messages
- **Auto-dismiss**: Disappears after 4 seconds

## 🎨 Design System

### Color Scheme
- **Primary**: Purple gradients (#9333EA to #7E22CE)
- **Text**: Light purple (#C4B5FD) on dark backgrounds
- **Success**: Green accents for positive actions
- **Error**: Red accents for warnings/errors

### Typography
- **Headers**: 24-32px bold for section titles
- **Counters**: 48px bold with gradient effects
- **Body**: 14px regular for descriptions
- **Buttons**: 14px medium weight

### Cards & Components
- **Border Radius**: 16px consistently across all elements
- **Glassmorphism**: Semi-transparent backgrounds with 20px blur
- **Shadows**: Subtle glows matching component colors
- **Spacing**: 16px padding inside cards, 8px between elements

### Interactions
- **Button Press**: Scales to 0.98x with 100ms duration
- **Card Hover**: Lifts 2px with 200ms ease transition
- **Loading States**: 70% opacity with disabled interactions
- **Touch Targets**: Minimum 44px, recommended 48px

## 📱 Mobile Optimization

### Safe Areas
- **Top**: Accounts for status bar and notches
- **Bottom**: Accounts for home indicator (34px on iPhone)
- **Sides**: 16px minimum margins on all screens

### Performance
- **Animations**: Only transform and opacity for 60fps
- **Images**: Retina-optimized assets
- **Blur Effects**: Limited to maintain smooth scrolling

### Responsive Design
- **Mobile First**: Optimized for 375px width (iPhone)
- **Scaling**: Proportional sizing up to tablet sizes
- **Touch-Friendly**: All interactive elements easily tappable

---

*This guide covers the complete DeSocial mobile app interface and user experience.*
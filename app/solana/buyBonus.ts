import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getGlobalRegistryAddress, generateAddresses } from './addressUtils';
import { getLatestMemo, generateReferralCode, UserState } from './memo';
import { decryptSigFromBackend, requestSig } from './transactionUtils';
import { createTransferWithMemo, sendTransaction } from './transactionUtils';

/**
 * Multiple API endpoints to fetch SOL price
 */
const priceApis = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    parser: (data: any) => data.solana?.usd
  },
  {
    name: 'Binance',
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
    parser: (data: any) => parseFloat(data.price)
  },
  {
    name: 'CoinCap',
    url: 'https://api.coincap.io/v2/assets/solana',
    parser: (data: any) => parseFloat(data.data?.priceUsd)
  },
  {
    name: 'CryptoCompare',
    url: 'https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD',
    parser: (data: any) => data.USD
  },
  {
    name: 'CoinPaprika',
    url: 'https://api.coinpaprika.com/v1/tickers/sol-solana',
    parser: (data: any) => data.quotes?.USD?.price
  },
  {
    name: 'Kraken',
    url: 'https://api.kraken.com/0/public/Ticker?pair=SOLUSD',
    parser: (data: any) => {
      const ticker = data.result?.SOLUSD;
      return ticker ? parseFloat(ticker.c[0]) : null;
    }
  },
  {
    name: 'CoinMarketCap',
    url: 'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/market-quotes/latest?id=1024&convertId=2781',
    parser: (data: any) => data.data?.cryptoCurrencyList?.[0]?.quotes?.[0]?.price
  },
  {
    name: 'Bitfinex',
    url: 'https://api-pub.bitfinex.com/v2/ticker/tSOLUSD',
    parser: (data: any) => Array.isArray(data) ? parseFloat(data[6]) : null // Last price
  }
];

/**
 * Fetch SOL price from multiple APIs with fallback
 */
async function fetchSolPrice(): Promise<number> {
  console.log('🔍 Fetching SOL price from multiple sources...');
  
  // Try each API in sequence
  for (const api of priceApis) {
    try {
      console.log(`Trying ${api.name}...`);
      const response = await fetch(api.url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout per request
      });
      
      if (!response.ok) {
        console.log(`${api.name} failed with status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const price = api.parser(data);
      
      if (price && typeof price === 'number' && price > 0) {
        console.log(`✅ SOL price fetched from ${api.name}: $${price}`);
        return price;
      }
    } catch (error) {
      console.log(`❌ ${api.name} error:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  throw new Error('All price APIs failed');
}

/**
 * Calculate SOL amount needed for $1
 */
function calculateSolAmount(solPriceUsd: number): number {
  const dollarAmount = 1; // $1
  const solAmount = dollarAmount / solPriceUsd;
  return solAmount;
}

/**
 * Convert SOL to lamports
 */
function getSolInLamports(solAmount: number): number {
  return Math.floor(solAmount * 1000000000); // Convert to lamports
}

/**
 * Handle bonus points purchase
 * Sends payment to global address and adds points directly to user's blockchain state
 */
export async function handleBonusPurchase(
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: (transaction: any) => Promise<any>
): Promise<{ success: boolean; signature?: string; error?: string; solAmount?: number }> {
  try {
    console.log('🎯 Starting bonus points purchase...');
    console.log('User wallet:', publicKey.toString());

    // Check if user has already purchased bonus points
    const hasPurchased = localStorage.getItem('desocial_bonus_purchased') === 'true';
    if (hasPurchased) {
      console.log('❌ User has already purchased bonus points');
      return {
        success: false,
        error: 'You have already purchased bonus points. Only one purchase allowed per account.'
      };
    }

    // Check if user is verified
    const isVerified = localStorage.getItem('desocial_verified') === 'true';
    if (!isVerified) {
      throw new Error('Please verify your account first to purchase bonus points');
    }

    // Fetch current SOL price
    console.log('💰 Fetching current SOL price...');
    const solPriceUsd = await fetchSolPrice();
    
    // Calculate SOL amount for $1
    const solAmount = calculateSolAmount(solPriceUsd);
    const lamports = getSolInLamports(solAmount);
    
    console.log(`💵 Price: $${solPriceUsd} USD per SOL`);
    console.log(`🪙 Amount: ${solAmount.toFixed(6)} SOL (${lamports} lamports)`);

    // Get user's addresses
    const addresses = await generateAddresses(publicKey.toString());
    const referralCode = generateReferralCode(publicKey.toString());

    console.log('🔍 Fetching current user state from blockchain...');
    
    // Get current memo from user's referral address
    const currentMemo = await getLatestMemo(connection, addresses.referralAddress, publicKey.toString());
    
    if (!currentMemo) {
      throw new Error('No account found on blockchain. Please verify your account first.');
    }

    console.log('✅ Found current state on blockchain');

    // Handle memo format - might include timestamp
    let cleanMemo = currentMemo;
    if (currentMemo.includes(':')) {
      cleanMemo = currentMemo.split(':')[0];
      console.log('🔧 Removed timestamp from memo, new length:', cleanMemo.length, 'chars');
    }

    // Decrypt current state
    console.log('🔓 Decrypting current user state...');
    const currentState = await decryptSigFromBackend(cleanMemo);
    
    console.log('✅ Current state decrypted:', currentState);

    // Update points (add 10,000 bonus points)
    const bonusPoints = 10000;
    const updatedState: UserState = {
      ...currentState,
      p: (currentState.p || 0) + bonusPoints
    };

    console.log('📝 Updated state with bonus points:', updatedState);

    // Get new encrypted sig for updated state
    console.log('🔐 Requesting new encrypted sig...');
    const newSig = await requestSig(updatedState);
    
    // Add timestamp to make transaction unique
    const timestamp = Date.now();
    const memoData = `${newSig}:${timestamp}`;

    console.log('✅ New sig generated, creating transactions...');

    // Create payment transaction to global address
    const globalAddress = getGlobalRegistryAddress();
    
    console.log('💸 Creating payment transaction...');
    console.log('From:', publicKey.toString());
    console.log('To Global:', globalAddress.toString());
    console.log('Amount:', `${solAmount.toFixed(6)} SOL`);
    
    // Create SINGLE transaction with both payment and memo
    console.log('💸 Creating single transaction with payment + memo...');
    console.log('From:', publicKey.toString());
    console.log('To Global:', globalAddress.toString());
    console.log('To Referral:', addresses.referralAddress.toString());
    console.log('Amount:', `${solAmount.toFixed(6)} SOL`);
    
    // Create single transaction with payment to global + memo to referral
    const combinedTransaction = new Transaction();
    
    // Add payment instruction
    combinedTransaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: globalAddress,
        lamports: lamports,
      })
    );
    
    // Add memo instructions to referral address
    const memoInstructions = createTransferWithMemo(
      publicKey,
      addresses.referralAddress,
      memoData,
      0 // 0 lamports transfer for memo
    );
    memoInstructions.forEach(instruction => combinedTransaction.add(instruction));
    
    // Set fee payer
    combinedTransaction.feePayer = publicKey;

    // Send single combined transaction
    console.log('📡 Sending combined transaction...');
    const signature = await sendTransaction(connection, combinedTransaction, signTransaction);
    console.log('✅ Combined transaction sent:', signature);

    // Update blockchain points directly (no claimable storage)
    const newTotalPoints = (currentState.p || 0) + bonusPoints;
    
    // Update localStorage to reflect new blockchain state
    localStorage.setItem('desocial_points', newTotalPoints.toString());
    
    // Update blockchain user data if it exists
    const userData = localStorage.getItem('desocial_userdata');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        parsed.points = newTotalPoints;
        localStorage.setItem('desocial_userdata', JSON.stringify(parsed));
        console.log('📊 Updated blockchain user data to:', newTotalPoints);
      } catch (error) {
        console.error('Failed to update blockchain user data:', error);
      }
    }

    // DON'T store in desocial_bonus_purchases (no claimable tracking needed)
    // Points are directly on blockchain now

    console.log('🎉 Bonus purchase successful!');
    console.log('Transaction:', signature);
    console.log('New blockchain points:', newTotalPoints);
    
    // Mark bonus as purchased (prevent future purchases)
    localStorage.setItem('desocial_bonus_purchased', 'true');
    console.log('✅ Marked bonus as purchased - no more purchases allowed');
    
    // Trigger points update for all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));

    return {
      success: true,
      signature: signature,
      solAmount
    };

  } catch (error) {
    console.error('❌ Bonus purchase failed:', error);
    
    let errorMessage = 'Failed to purchase bonus points';
    if (error instanceof Error) {
      if (error.message.includes('All price APIs failed')) {
        errorMessage = 'Unable to fetch current SOL price. Please try again.';
      } else if (error.message.includes('authenticate data')) {
        errorMessage = 'Cannot decrypt blockchain data. Please try rescanning your account first.';
      } else if (error.message.includes('already been processed')) {
        errorMessage = 'Transaction already processed. Please wait a moment before trying again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
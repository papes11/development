import { Connection, Transaction, TransactionInstruction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiUtils';

/**
 * Creates a memo instruction
 */
export function createMemoInstruction(memoData: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program ID
    data: Buffer.from(memoData, 'utf8'),
  });
}

/**
 * Creates a tiny SOL transfer with memo to a specific address
 */
export function createTransferWithMemo(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  memoData: string,
  lamports: number // Amount should be provided (use getMinimumRentExempt or 0)
): TransactionInstruction[] {
  const instructions = [];
  
  // Add transfer instruction (even if 0 lamports)
  const transferInstruction = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  });
  instructions.push(transferInstruction);
  
  // Add memo instruction only if memo data is provided
  if (memoData && memoData.trim().length > 0) {
    const memoInstruction = createMemoInstruction(memoData);
    instructions.push(memoInstruction);
  }
  
  return instructions;
}

/**
 * Creates a transaction with multiple transfers and memos to different addresses
 */
export function createMultipleTransferMemoTransaction(
  fromPubkey: PublicKey,
  transfers: Array<{
    toPubkey: PublicKey;
    memoData: string;
    lamports: number; // Required - use getMinimumRentExempt()
  }>
): Transaction {
  const transaction = new Transaction();
  
  // Add all transfer + memo instruction pairs
  transfers.forEach(({ toPubkey, memoData, lamports }) => {
    const instructions = createTransferWithMemo(fromPubkey, toPubkey, memoData, lamports);
    instructions.forEach(instruction => transaction.add(instruction));
  });
  
  transaction.feePayer = fromPubkey;
  return transaction;
}

/**
 * Creates a transaction with multiple memo instructions (legacy)
 */
export function createMultipleMemoTransaction(
  fromPubkey: PublicKey,
  memoInstructions: TransactionInstruction[]
): Transaction {
  const transaction = new Transaction();
  
  // Add all memo instructions to the same transaction
  memoInstructions.forEach(instruction => {
    transaction.add(instruction);
  });
  
  transaction.feePayer = fromPubkey;
  return transaction;
}

/**
 * Creates a memo transaction with 0 SOL transfer (legacy - for single memo)
 */
export function createMemoTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  memoData: string
): Transaction {
  const transaction = new Transaction();
  
  // Add memo instruction
  const memoInstruction = createMemoInstruction(memoData);
  transaction.add(memoInstruction);
  transaction.feePayer = fromPubkey;
  
  return transaction;
}

/**
 * Send a transaction with duplicate prevention
 */
export async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
): Promise<string> {
  try {
    // Ensure fee payer is set
    if (!transaction.feePayer) {
      throw new Error('Transaction fee payer is not set');
    }
    
    console.log('Transaction fee payer:', transaction.feePayer.toString());
    console.log('Transaction instructions count:', transaction.instructions.length);
    
    // Get fresh blockhash to ensure transaction uniqueness
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    
    // Add a small delay to ensure uniqueness
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Signing transaction with blockhash:', blockhash);
    
    // Sign transaction
    const signedTransaction = await signTransaction(transaction);
    
    console.log('Sending transaction...');
    
    // Send transaction with proper options
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true, // Skip preflight to avoid simulation issues
        maxRetries: 0 // Don't retry to avoid duplicates
      }
    );
    
    console.log('Transaction sent with signature:', signature);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight
      },
      'confirmed'
    );
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    console.log('Transaction confirmed successfully:', signature);
    return signature;
    
  } catch (error) {
    console.error('Transaction failed:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already been processed')) {
        throw new Error('This transaction was already processed. Please try again with a fresh transaction.');
      }
      if (error.message.includes('Simulation failed')) {
        throw new Error('Transaction simulation failed. This might be due to insufficient funds or network issues.');
      }
    }
    
    throw error;
  }
}

/**
 * Send a memo transaction (legacy)
 */
export async function sendMemoTransaction(
  connection: Connection,
  transaction: Transaction,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
): Promise<string> {
  return sendTransaction(connection, transaction, signTransaction);
}

/**
 * Create memo JSON for different transaction types
 */
export function createMemoJSON(
  type: 'GLOBAL_REGISTER' | 'USER_REGISTER' | 'REF_INIT' | 'POINT_INIT',
  data: any,
  signature?: string
): string {
  const timestamp = Date.now();
  
  const memoData = {
    type,
    timestamp,
    ...data,
    ...(signature && { sig: signature })
  };
  
  return JSON.stringify(memoData);
}

/**
 * Get minimum rent exempt amount for an empty account
 */
export async function getMinimumRentExempt(connection: Connection): Promise<number> {
  try {
    // Get minimum balance for rent exemption (empty account = 0 bytes of data)
    return await connection.getMinimumBalanceForRentExemption(0);
  } catch (error) {
    console.warn('Failed to get minimum rent exempt amount, using default:', error);
    return 890880; // Fallback amount
  }
}
/**
 * Request sig from backend API
 * 
 * Sends user state to backend, receives encrypted sig
 */
export async function requestSig(userState: {
  u: string;
  w: string;
  rf: string;
  rb: string | null;
  rc: number;
  p: number;
}): Promise<string> {
  try {
    console.log('Requesting sig for user state:', userState);
    
    // Make request to our API endpoint
    const response = await fetch(getApiUrl(API_ENDPOINTS.SIGN_MEMO), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userState),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sig API error:', response.status, errorText);
      throw new Error(`Failed to get sig from backend: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Sig received, length:', result.sig?.length);
    
    if (!result.sig) {
      throw new Error('No sig returned from API');
    }
    
    return result.sig;
  } catch (error) {
    console.error('Sig request failed:', error);
    throw new Error(`Sig generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sig from backend API
 * 
 * Sends sig to backend, receives decrypted user state
 */
export async function decryptSigFromBackend(sig: string): Promise<{
  u: string;
  w: string;
  rf: string;
  rb: string | null;
  rc: number;
  p: number;
}> {
  try {
    console.log('🔓 Requesting sig decryption from backend, sig length:', sig.length);
    
    // Clean the sig - remove any timestamp or extra data
    let cleanSig = sig.trim();
    if (cleanSig.includes(':')) {
      cleanSig = cleanSig.split(':')[0];
      console.log('🔧 Cleaned sig (removed timestamp), new length:', cleanSig.length);
    }
    
    // Make request to our API endpoint
    const response = await fetch(getApiUrl(API_ENDPOINTS.SIGN_MEMO), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig: cleanSig }),
    });
    
    console.log('🔓 Decrypt API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Decrypt API error:', response.status, errorText);
      
      // Try to provide more helpful error messages
      if (response.status === 500 && errorText.includes('authenticate data')) {
        throw new Error('Unable to decrypt blockchain data. This might be due to a mnemonic mismatch or corrupted data.');
      }
      
      throw new Error(`Failed to decrypt sig: ${response.status} - ${errorText}`);
    }
    
    const userState = await response.json();
    console.log('✅ User state decrypted successfully:', userState);
    
    if (!userState.u || !userState.w || !userState.rf) {
      console.error('❌ Invalid user state returned:', userState);
      throw new Error('Invalid user state returned from API - missing required fields');
    }
    
    return userState;
  } catch (error) {
    console.error('❌ Sig decryption failed:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('authenticate data')) {
        throw new Error('Cannot decrypt blockchain data. The account might have been created with a different system version.');
      }
      if (error.message.includes('Invalid user state')) {
        throw new Error('Blockchain data is corrupted or in an unexpected format.');
      }
    }
    
    throw new Error(`Sig decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * @deprecated Use requestSig instead
 */
export async function requestSignature(memoData: any): Promise<string> {
  return requestSig(memoData);
}
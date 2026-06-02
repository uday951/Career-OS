import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive a 32-byte AES-256 key from the ENCRYPTION_KEY environment variable.
 * In production, set ENCRYPTION_KEY to a long, random string and keep it secret.
 * The key is hashed with SHA-256 to ensure it's exactly 32 bytes.
 */
function getKey() {
  const key = process.env.ENCRYPTION_KEY || 'change-me-in-production-use-a-long-random-string';
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string.
 * Returns format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(text) {
  if (!text) return text;
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with encrypt().
 */
export function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  
  try {
    const key = getKey();
    const parts = encryptedText.split(':');
    
    if (parts.length < 3) return encryptedText;
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts.slice(2).join(':');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

export default { encrypt, decrypt };

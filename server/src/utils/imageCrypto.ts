import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IMAGE_ENCRYPTION_KEY = crypto.createHash('sha256').update(env.IMAGE_ENCRYPTION_KEY || env.JWT_SECRET).digest();
const IV_LENGTH = 16;

// IV hex representation is always 32 characters (16 bytes -> 32 hex chars)
export const IV_HEX_LENGTH = IV_LENGTH * 2;

/**
 * Encrypts an image buffer using AES-256-CBC.
 * A random IV is generated for each encryption to ensure that
 * identical images produce different ciphertexts.
 *
 * Why Cloudinary cannot view encrypted images:
 * The image binary data is encrypted BEFORE transmission to Cloudinary.
 * Cloudinary receives only the AES-256 encrypted ciphertext, not the
 * original image pixels. Without the secret key and IV, Cloudinary
 * (or anyone with access to the Cloudinary URL) cannot recover the
 * original image.
 */
export const encryptImageBuffer = (
  buffer: Buffer
): { encryptedBuffer: Buffer; iv: string } => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, IMAGE_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encryptedBuffer: encrypted, iv: iv.toString('hex') };
};

/**
 * Decrypts an image buffer using AES-256-CBC.
 * Requires the same IV that was used during encryption.
 *
 * The IV is stored alongside the Cloudinary URL in the message
 * content field. It is not secret (IVs are designed to be public),
 * but the encryption key MUST remain secret.
 */
export const decryptImageBuffer = (
  encryptedBuffer: Buffer,
  ivHex: string
): Buffer => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, IMAGE_ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
  return decrypted;
};

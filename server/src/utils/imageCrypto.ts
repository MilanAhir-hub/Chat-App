import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IMAGE_ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(env.JWT_SECRET)
  .digest();
const IV_LENGTH = 16;

export const IV_HEX_LENGTH = IV_LENGTH * 2;

export const encryptImageBuffer = (
  buffer: Buffer
): { encryptedBuffer: Buffer; iv: string } => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, IMAGE_ENCRYPTION_KEY, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return { encryptedBuffer, iv: iv.toString('hex') };
};

export const decryptImageBuffer = (
  encryptedBuffer: Buffer,
  ivHex: string
): Buffer => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, IMAGE_ENCRYPTION_KEY, iv);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

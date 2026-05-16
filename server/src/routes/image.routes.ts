import { Router } from 'express';
import https from 'https';
import { Message } from '../models/Message';
import { asyncHandler } from '../utils/asyncHandler';
import { decrypt } from '../utils/crypto';
import { decryptImageBuffer, IV_HEX_LENGTH } from '../utils/imageCrypto';
import { AppError } from '../utils/AppError';

const router = Router();

router.get('/:messageId', asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);

  if (!message || message.type !== 'file') {
    throw new AppError('Image not found.', 404);
  }

  const decryptedContent = decrypt(message.content);
  const ivHex = decryptedContent.slice(0, IV_HEX_LENGTH);
  const cloudinaryUrl = decryptedContent.slice(IV_HEX_LENGTH);

  if (!/^[0-9a-f]{32}$/i.test(ivHex) || !cloudinaryUrl.startsWith('https://')) {
    throw new AppError('Encrypted image metadata is invalid.', 500);
  }

  const encryptedBuffer = await new Promise<Buffer>((resolve, reject) => {
    https.get(cloudinaryUrl, (response) => {
      const chunks: Buffer[] = [];

      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });

  const decryptedBuffer = decryptImageBuffer(encryptedBuffer, ivHex);

  console.info('[image-decrypt]', {
    messageId: req.params.messageId,
    encryptedBytes: encryptedBuffer.length,
    decryptedBytes: decryptedBuffer.length,
    mimetype: message.fileType || 'application/octet-stream',
    decryptedHeader: decryptedBuffer.subarray(0, 8).toString('hex'),
  });

  res.setHeader('Content-Type', message.fileType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.send(decryptedBuffer);
}));

export default router;

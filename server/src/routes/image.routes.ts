import { Router } from 'express';
import https from 'https';
import { protect } from '../middleware/auth.middleware';
import { Message } from '../models/Message';
import { AppError } from '../utils/AppError';
import { decrypt } from '../utils/crypto';
import { decryptImageBuffer, IV_HEX_LENGTH } from '../utils/imageCrypto';
import { assertRoomMember } from '../services/room.service';

const router = Router();

/**
 * GET /api/images/:messageId
 *
 * Serves a decrypted image by proxying through the server:
 * 1. Looks up the message to get the encrypted Cloudinary URL + IV
 * 2. Downloads the encrypted (AES-256 ciphertext) image from Cloudinary
 * 3. Decrypts the image buffer using the stored IV
 * 4. Returns the raw decrypted image bytes with proper Content-Type
 *
 * Why this is secure:
 * - Cloudinary only ever receives and stores encrypted binary data
 * - The decryption key is server-only, never exposed to the client
 * - The IV is stored in the encrypted message content in MongoDB
 * - Only authenticated room members can access this endpoint
 */
router.get('/:messageId', protect, async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new AppError('Message not found.', 404);
    }

    // Verify the requesting user is an active member of the room
    await assertRoomMember(message.roomId, req.user!.id);

    // Decrypt the message content to extract IV + Cloudinary URL
    // Stored format: <32-char-iv-hex><cloudinary-url>
    const decryptedContent = decrypt(message.content);
    const ivHex = decryptedContent.substring(0, IV_HEX_LENGTH);
    const cloudinaryUrl = decryptedContent.substring(IV_HEX_LENGTH);

    // Validate that the extracted IV is valid hex and the URL is non-empty
    const hasValidIv = /^[0-9a-f]{32}$/i.test(ivHex) && cloudinaryUrl.length > 0;

    // Download the encrypted image from Cloudinary
    const encryptedBuffer = await new Promise<Buffer>((resolve, reject) => {
      https.get(cloudinaryUrl, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });

    // Decrypt the image buffer (for legacy messages without IV, serve as-is)
    const decryptedBuffer = hasValidIv
      ? decryptImageBuffer(encryptedBuffer, ivHex)
      : encryptedBuffer;

    const contentType = message.fileType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.setHeader('Cache-Control', 'private, max-age=31536000');
    res.end(decryptedBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;

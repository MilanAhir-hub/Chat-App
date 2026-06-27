import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { requireChatUnlock } from '../middleware/secureAuth.middleware';
import {
  createSecureChatSchema,
  unlockSecureChatSchema,
  secureChatParamsSchema,
} from '../validations/secureChat.validation';
import {
  createSecureChatHandler,
  getSecureMessagesHandler,
  listSecureChatsHandler,
  unlockSecureChatHandler,
  searchUsersHandler,
} from '../controllers/secureChat.controller';

const router = Router();

router.use(protect);

router.get('/users', searchUsersHandler);
router.post('/', validateRequest(createSecureChatSchema), createSecureChatHandler);
router.get('/', listSecureChatsHandler);
router.post('/:chatId/unlock', validateRequest(secureChatParamsSchema), validateRequest(unlockSecureChatSchema), unlockSecureChatHandler);
router.get('/:chatId/messages', validateRequest(secureChatParamsSchema), requireChatUnlock, getSecureMessagesHandler);

export default router;

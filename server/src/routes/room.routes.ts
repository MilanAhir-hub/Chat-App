import { Router } from 'express';
import {
  closeRoomHandler,
  createRoomHandler,
  getRoomHandler,
  getRoomMessagesHandler,
  joinRoomHandler,
  leaveRoomHandler,
} from '../controllers/room.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { joinRoomSchema, roomParamsSchema } from '../validations/room.validation';

const router = Router();

router.use(protect);

router.post('/', createRoomHandler);
router.post('/join', validateRequest(joinRoomSchema), joinRoomHandler);
router.get('/:roomId', validateRequest(roomParamsSchema), getRoomHandler);
router.get(
  '/:roomId/messages',
  validateRequest(roomParamsSchema),
  getRoomMessagesHandler
);
router.post(
  '/:roomId/leave',
  validateRequest(roomParamsSchema),
  leaveRoomHandler
);
router.post(
  '/:roomId/close',
  validateRequest(roomParamsSchema),
  closeRoomHandler
);

export default router;

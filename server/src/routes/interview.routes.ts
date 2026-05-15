import { Router } from 'express';
import {
  getInterviewDashboardHandler,
  getInterviewHandler,
  startInterviewHandler,
  submitInterviewHandler,
} from '../controllers/interview.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  interviewParamsSchema,
  startInterviewSchema,
  submitInterviewSchema,
} from '../validations/interview.validation';

const router = Router();

router.use(protect);

router.get('/dashboard', getInterviewDashboardHandler);
router.post('/', validateRequest(startInterviewSchema), startInterviewHandler);
router.get(
  '/:interviewId',
  validateRequest(interviewParamsSchema),
  getInterviewHandler
);
router.post(
  '/:interviewId/submit',
  validateRequest(submitInterviewSchema),
  submitInterviewHandler
);

export default router;

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { aiBudget } from '../middlewares/aiBudget.middleware';
import { productionRateStore } from '../services/rateLimit.service';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  answerInterviewQuestionSchema, createInterviewSessionSchema, interviewQuestionParamSchema,
  interviewSessionParamSchema, updateInterviewSessionSchema,
} from '../validators/interview.validator';
import {
  answerInterviewQuestion, createInterviewSession, deleteInterviewSession,
  getInterviewSession, listInterviewSessions, updateInterviewSession,
} from '../controllers/interview.controller';

const router = Router();
const generationLimiter = rateLimit({
  store: productionRateStore('interview'),
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many interview AI requests. Please wait 15 minutes before trying again.' },
});

router.use(authenticate);
router.get('/', listInterviewSessions);
router.post('/', generationLimiter, validate(createInterviewSessionSchema), aiBudget, createInterviewSession);
router.get('/:id', validate(interviewSessionParamSchema, 'params'), getInterviewSession);
router.patch('/:id', validate(interviewSessionParamSchema, 'params'), validate(updateInterviewSessionSchema), updateInterviewSession);
router.delete('/:id', validate(interviewSessionParamSchema, 'params'), deleteInterviewSession);
router.post('/:id/questions/:questionId/answer', generationLimiter, validate(interviewQuestionParamSchema, 'params'), validate(answerInterviewQuestionSchema), aiBudget, answerInterviewQuestion);

export default router;

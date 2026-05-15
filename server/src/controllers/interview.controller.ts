import type { Request, RequestHandler } from 'express';
import {
  getInterviewDashboard,
  getInterviewForUser,
  startInterview,
  submitInterview,
} from '../services/interview.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new AppError('Please login to continue.', 401);
  }

  return req.user;
};

export const getInterviewDashboardHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = requireUser(req);
    const dashboard = await getInterviewDashboard(user.id);

    res.status(200).json({
      success: true,
      dashboard,
    });
  }
);

export const startInterviewHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const interview = await startInterview({
    userId: user.id,
    role: req.body.role,
    level: req.body.level,
    questionCount: req.body.questionCount,
  });

  res.status(201).json({
    success: true,
    message: 'Interview started successfully.',
    interview,
  });
});

export const submitInterviewHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = requireUser(req);
    const interview = await submitInterview({
      userId: user.id,
      interviewId: String(req.params.interviewId),
      answers: req.body.answers,
    });

    res.status(200).json({
      success: true,
      message: 'Interview report generated successfully.',
      interview,
    });
  }
);

export const getInterviewHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const interview = await getInterviewForUser(String(req.params.interviewId), user.id);

  res.status(200).json({
    success: true,
    interview,
  });
});

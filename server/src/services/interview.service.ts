import { Types } from 'mongoose';
import { Interview, type IInterview, type InterviewLevel } from '../models/Interview';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { changeCredits, getCreditHistory } from './credit.service';

interface StartInterviewInput {
  userId: string;
  role: string;
  level: InterviewLevel;
  questionCount: number;
}

interface SubmitInterviewInput {
  userId: string;
  interviewId: string;
  answers: string[];
}

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');

const questionBank = [
  {
    topic: 'scope',
    question: 'Explain how you would break down a new feature before writing code.',
    aiAnswer:
      'I clarify the user goal, identify edge cases, sketch the data flow, choose the smallest useful milestone, and define how I will verify the behavior before implementation.',
  },
  {
    topic: 'debugging',
    question: 'A production report is not generated. How would you debug it end to end?',
    aiAnswer:
      'I would reproduce the failing path, inspect client errors, verify API responses, check validation and authentication, confirm database writes, inspect server logs, and add a focused regression test around the broken report generation step.',
  },
  {
    topic: 'database',
    question: 'How do you design a schema for storing user history and reports?',
    aiAnswer:
      'I store immutable report records linked to the user, keep summary fields for fast dashboards, index by user and creation date, and store detailed nested question answers in the report document when they are read together.',
  },
  {
    topic: 'security',
    question: 'What should be verified before crediting a user after an online payment?',
    aiAnswer:
      'The backend should verify the payment provider signature or trusted test payload, confirm the amount and order, prevent duplicate payment IDs, and only then update the credit balance in a database transaction or equivalent guarded operation.',
  },
  {
    topic: 'frontend',
    question: 'How would you make a dashboard graph useful instead of decorative?',
    aiAnswer:
      'I would show the metric that drives decisions, label axes clearly, include recent trend data, handle empty states, and keep the graph close to the controls or history it explains.',
  },
  {
    topic: 'api',
    question: 'What makes an API endpoint reliable for a multi-step workflow?',
    aiAnswer:
      'It validates inputs, checks ownership, returns predictable errors, keeps side effects explicit, is idempotent where needed, and exposes enough state for the client to recover after refreshes.',
  },
  {
    topic: 'testing',
    question: 'Which tests would you add before shipping interview reports?',
    aiAnswer:
      'I would test credit deduction, insufficient credit handling, interview submission, report retrieval authorization, PDF export data rendering, and the dashboard history summary after an interview is completed.',
  },
  {
    topic: 'performance',
    question: 'How would you keep history pages fast as records grow?',
    aiAnswer:
      'I would paginate history, index by user and created date, keep summary fields on the interview record, avoid loading full answer bodies until the report page, and cache stable aggregate data when needed.',
  },
  {
    topic: 'communication',
    question: 'Describe a time you would push back on a requested implementation.',
    aiAnswer:
      'I would push back when the request creates security, reliability, or product risk, explain the tradeoff clearly, propose a safer path, and still help the team reach the original goal.',
  },
  {
    topic: 'architecture',
    question: 'How would you separate payment, credit, and interview responsibilities?',
    aiAnswer:
      'Payment code should verify provider events, credit code should be the only place that mutates balances, and interview code should consume credits through that service instead of editing user balances directly.',
  },
];

const levelPrompts: Record<InterviewLevel, string> = {
  junior: 'Focus your answer on clear fundamentals and practical steps.',
  mid: 'Include tradeoffs, ownership, and how you would verify the result.',
  senior: 'Include system boundaries, failure modes, observability, and rollout strategy.',
};

const pickQuestions = (role: string, level: InterviewLevel, count: number) => {
  const offset = Math.abs(
    role.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  ) % questionBank.length;

  return Array.from({ length: count }, (_, index) => {
    const item = questionBank[(offset + index) % questionBank.length];
    return {
      question: `${item.question} (${role}, ${level})`,
      userAnswer: '',
      aiAnswer: `${item.aiAnswer} ${levelPrompts[level]}`,
      score: 0,
      feedback: '',
      topics: [item.topic, role.toLowerCase()],
    };
  });
};

const scoreAnswer = (answer: string, aiAnswer: string) => {
  const cleanAnswer = normalizeText(answer).toLowerCase();
  const cleanAiAnswer = normalizeText(aiAnswer).toLowerCase();

  if (cleanAnswer.length < 20) {
    return {
      score: cleanAnswer.length === 0 ? 0 : 25,
      feedback:
        'The answer is too short. Add concrete steps, a reason for each step, and a verification plan.',
    };
  }

  const expectedWords = new Set(
    cleanAiAnswer
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 4)
  );
  const answerWords = new Set(cleanAnswer.split(/[^a-z0-9]+/));
  const overlap = [...expectedWords].filter((word) => answerWords.has(word)).length;
  const coverage = expectedWords.size ? overlap / expectedWords.size : 0;
  const lengthScore = Math.min(35, Math.floor(cleanAnswer.length / 12));
  const score = Math.max(35, Math.min(100, Math.round(35 + coverage * 45 + lengthScore)));

  const feedback =
    score >= 80
      ? 'Strong answer. It covers the core idea and gives enough implementation detail.'
      : score >= 60
        ? 'Good direction. Improve it by adding clearer sequencing, risks, and how you would validate the result.'
        : 'Needs more depth. Tie your answer to the problem, include tradeoffs, and finish with a measurable validation step.';

  return { score, feedback };
};

const formatInterview = (interview: IInterview) => ({
  id: interview._id.toString(),
  title: interview.title,
  role: interview.role,
  level: interview.level,
  status: interview.status,
  creditsUsed: interview.creditsUsed,
  overallScore: interview.overallScore,
  questions: interview.questions,
  completedAt: interview.completedAt?.toISOString(),
  createdAt: interview.createdAt.toISOString(),
  updatedAt: interview.updatedAt.toISOString(),
});

export const startInterview = async (input: StartInterviewInput) => {
  const user = await User.findById(input.userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.credits < input.questionCount) {
    throw new AppError('Not enough credits for this interview.', 402);
  }

  await changeCredits({
    userId: input.userId,
    amount: -input.questionCount,
    type: 'use',
    description: `Started ${input.questionCount}-question ${input.role} interview`,
    provider: 'system',
  });

  const interview = await Interview.create({
    user: input.userId,
    title: `${input.role} Interview`,
    role: input.role,
    level: input.level,
    creditsUsed: input.questionCount,
    questions: pickQuestions(input.role, input.level, input.questionCount),
  });

  return formatInterview(interview);
};

export const submitInterview = async (input: SubmitInterviewInput) => {
  const interview = await Interview.findOne({
    _id: input.interviewId,
    user: input.userId,
  });

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  interview.questions = interview.questions.map((question, index) => {
    const userAnswer = normalizeText(input.answers[index] || '');
    const result = scoreAnswer(userAnswer, question.aiAnswer);

    return {
      question: question.question,
      aiAnswer: question.aiAnswer,
      topics: question.topics,
      userAnswer,
      score: result.score,
      feedback: result.feedback,
    };
  });

  const totalScore = interview.questions.reduce((total, item) => total + item.score, 0);
  interview.overallScore = Math.round(totalScore / interview.questions.length);
  interview.status = 'completed';
  interview.completedAt = new Date();

  await interview.save();
  return formatInterview(interview);
};

export const getInterviewForUser = async (interviewId: string, userId: string) => {
  if (!Types.ObjectId.isValid(interviewId)) {
    throw new AppError('Interview not found.', 404);
  }

  const interview = await Interview.findOne({ _id: interviewId, user: userId });

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  return formatInterview(interview);
};

export const getInterviewDashboard = async (userId: string) => {
  const [user, interviews, creditHistory] = await Promise.all([
    User.findById(userId).select('credits name email'),
    Interview.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
    getCreditHistory(userId),
  ]);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const completed = interviews.filter((item) => item.status === 'completed');
  const creditsUsed = interviews.reduce((total, item) => total + item.creditsUsed, 0);
  const averageScore = completed.length
    ? Math.round(
        completed.reduce((total, item) => total + item.overallScore, 0) /
          completed.length
      )
    : 0;

  const usageByDay = new Map<string, { label: string; questions: number; credits: number }>();
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
    usageByDay.set(key, { label, questions: 0, credits: 0 });
    return key;
  });

  interviews.forEach((interview) => {
    const key = interview.createdAt.toISOString().slice(0, 10);
    if (usageByDay.has(key)) {
      const current = usageByDay.get(key);
      if (current) {
        current.questions += interview.questions.length;
        current.credits += interview.creditsUsed;
      }
    }
  });

  return {
    credits: user.credits,
    stats: {
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      creditsUsed,
      averageScore,
    },
    usageGraph: recentDays.map((key) => usageByDay.get(key)),
    interviews: interviews.map(formatInterview),
    creditHistory: creditHistory.map((item) => ({
      id: item._id.toString(),
      type: item.type,
      amount: item.amount,
      balanceAfter: item.balanceAfter,
      description: item.description,
      provider: item.provider,
      createdAt: item.createdAt.toISOString(),
    })),
  };
};

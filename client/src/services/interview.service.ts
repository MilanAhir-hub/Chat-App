import { api } from './http';
import type { Interview, InterviewDashboard, InterviewLevel } from '../types';

interface StartInterviewPayload {
  role: string;
  level: InterviewLevel;
  questionCount: number;
}

export const interviewService = {
  async getDashboard() {
    const { data } = await api.get<{ dashboard: InterviewDashboard }>(
      '/interviews/dashboard'
    );
    return data.dashboard;
  },

  async startInterview(payload: StartInterviewPayload) {
    const { data } = await api.post<{ message: string; interview: Interview }>(
      '/interviews',
      payload
    );
    return data;
  },

  async getInterview(interviewId: string) {
    const { data } = await api.get<{ interview: Interview }>(
      `/interviews/${interviewId}`
    );
    return data.interview;
  },

  async submitInterview(interviewId: string, answers: string[]) {
    const { data } = await api.post<{ message: string; interview: Interview }>(
      `/interviews/${interviewId}/submit`,
      { answers }
    );
    return data;
  },
};

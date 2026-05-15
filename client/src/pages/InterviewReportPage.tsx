import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/http';
import { interviewService } from '../services/interview.service';
import type { Interview } from '../types';
import { downloadInterviewPdf } from '../utils/pdf';

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : 'Not completed';

export const InterviewReportPage = () => {
  const { interviewId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      if (!interviewId) {
        setError('Interview not found.');
        setIsLoading(false);
        return;
      }

      try {
        const nextInterview = await interviewService.getInterview(interviewId);
        if (isMounted) {
          setInterview(nextInterview);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      isMounted = false;
    };
  }, [interviewId]);

  if (isLoading) {
    return (
      <main className="flex h-dvh items-center justify-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <Loader />
      </main>
    );
  }

  if (error || !interview) {
    return (
      <main className="flex h-dvh items-center justify-center bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900/70 dark:bg-slate-900">
          <p className="text-sm font-semibold text-red-700 dark:text-red-200">
            {error || 'Report not found.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh overflow-y-auto bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300 sm:text-xs">
              {formatDate(interview.completedAt)}
            </p>
            <h1 className="truncate text-lg font-bold sm:text-2xl">Interview Report</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => downloadInterviewPdf(interview, user)}
              className="rounded-full bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-500"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ['Score', `${interview.overallScore}%`],
            ['Questions', String(interview.questions.length)],
            ['Credits', String(interview.creditsUsed)],
            ['Level', interview.level],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-black capitalize">{value}</p>
            </div>
          ))}
        </div>

        {interview.questions.map((question, index) => (
          <article
            key={`${question.question}-${index}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-bold leading-relaxed sm:text-lg">
                {index + 1}. {question.question}
              </h2>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black dark:bg-slate-800">
                {question.score}/100
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              <section className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  My Answer
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {question.userAnswer || 'No answer provided.'}
                </p>
              </section>

              <section className="rounded-lg bg-emerald-50 p-4 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
                  AI Optimized Answer
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {question.aiAnswer}
                </p>
              </section>

              <section className="rounded-lg bg-cyan-50 p-4 text-cyan-950 dark:bg-cyan-950/30 dark:text-cyan-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-200">
                  Feedback
                </h3>
                <p className="mt-2 text-sm leading-relaxed">
                  {question.feedback || 'Submit the interview to generate feedback.'}
                </p>
              </section>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

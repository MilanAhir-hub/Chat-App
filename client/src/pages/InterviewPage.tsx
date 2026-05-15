import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { getErrorMessage } from '../services/http';
import { interviewService } from '../services/interview.service';
import type { Interview } from '../types';

export const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadInterview = async () => {
      if (!interviewId) {
        setError('Interview not found.');
        setIsLoading(false);
        return;
      }

      try {
        const nextInterview = await interviewService.getInterview(interviewId);
        if (!isMounted) {
          return;
        }
        if (nextInterview.status === 'completed') {
          navigate(`/interviews/${nextInterview.id}/report`, { replace: true });
          return;
        }
        setInterview(nextInterview);
        setAnswers(nextInterview.questions.map((question) => question.userAnswer || ''));
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

    void loadInterview();

    return () => {
      isMounted = false;
    };
  }, [interviewId, navigate]);

  const submitInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!interview) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await interviewService.submitInterview(interview.id, answers);
      navigate(`/interviews/${response.interview.id}/report`, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {error || 'Interview not found.'}
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300 sm:text-xs">
              {interview.role} · {interview.level}
            </p>
            <h1 className="truncate text-lg font-bold sm:text-2xl">Interview Questions</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="shrink-0 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Dashboard
          </button>
        </div>
      </header>

      <form
        onSubmit={submitInterview}
        className="mx-auto grid max-w-5xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8"
      >
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {interview.questions.map((question, index) => (
          <section
            key={question.question}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-black text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold leading-relaxed sm:text-lg">
                  {question.question}
                </h2>
                <textarea
                  required
                  rows={6}
                  value={answers[index] || ''}
                  onChange={(event) =>
                    setAnswers((current) => {
                      const next = [...current];
                      next[index] = event.target.value;
                      return next;
                    })
                  }
                  className="mt-4 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-relaxed text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Write your answer here..."
                />
              </div>
            </div>
          </section>
        ))}

        <div className="sticky bottom-0 z-10 -mx-3 border-t border-slate-200 bg-white/90 px-3 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:mx-0 sm:rounded-lg sm:border sm:px-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-800"
          >
            {isSubmitting ? <Loader size="sm" light /> : 'Generate Report'}
          </button>
        </div>
      </form>
    </main>
  );
};

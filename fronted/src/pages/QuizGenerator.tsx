import { useEffect, useState } from 'react';
import { BrainCircuit, CheckCircle2, XCircle, Trash2, RotateCcw, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { Quiz, QuizSummary } from '../types';

interface QuestionReview {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  selected_option: string | null;
  is_correct: boolean;
}

interface SubmitResponse {
  attempt: {
    id: number;
    quiz_id: number;
    score: number;
    total_questions: number;
  };
  questions: QuestionReview[];
}

export default function QuizGenerator() {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api<QuizSummary[]>('/api/quizzes')
      .then(setQuizzes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load quizzes.'));

  useEffect(() => {
    void load();
  }, []);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const q = await api<Quiz>('/api/quizzes/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: topic.trim() || 'Computer Science & Software Engineering',
          question_count: count,
        }),
      });
      setQuiz(q);
      setAnswers({});
      setResult(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quiz generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const deleteQuiz = async (quizId: number) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (quiz?.id === quizId) {
        setQuiz(null);
        setResult(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete quiz.');
    }
  };

  const submit = async () => {
    if (!quiz) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<SubmitResponse>(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: Object.entries(answers).map(([id, selected_option]) => ({
            question_id: Number(id),
            selected_option,
          })),
        }),
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
          <BrainCircuit className="text-blue-600" />
          AI Quiz Generator
        </h1>
        {quiz && (
          <button
            onClick={() => {
              setQuiz(null);
              setResult(null);
              setAnswers({});
            }}
            className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
          >
            <RotateCcw size={16} /> All Quizzes
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {quiz?.used_fallback && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-800 text-sm border border-amber-200">
          Gemini could not generate this quiz, so these are generic placeholder questions. Check
          GEMINI_API_KEY and the backend logs, then generate again.
        </div>
      )}

      {!quiz ? (
        <>
          {/* Generation form */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Generate an AI Study Quiz</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter any subject or concept, and Gemini will build custom multiple-choice questions
              with explanations.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Topic or Subject
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Operating Systems, Data Structures, Calculus..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Questions (2 - 10)
                </label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Math.max(2, Math.min(10, Number(e.target.value))))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={busy}
              className="mt-6 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-60 transition-colors shadow-sm"
            >
              {busy ? 'Generating Quiz with Gemini...' : 'Generate & Start Quiz'}
            </button>
          </div>

          {/* Existing quizzes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 text-lg">Your Saved Quizzes</h2>
            <div className="space-y-3">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{q.title}</h3>
                    <p className="text-xs text-gray-500">
                      {q.question_count} questions • Created{' '}
                      {new Date(q.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        api<Quiz>(`/api/quizzes/${q.id}`)
                          .then((x) => {
                            setQuiz(x);
                            setAnswers({});
                            setResult(null);
                          })
                          .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
                      }
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      Take <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => void deleteQuiz(q.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete quiz"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {!quizzes.length && (
                <p className="text-gray-500 text-center py-6 text-sm">
                  No quizzes yet. Generate your first quiz above!
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Quiz solving & review screen */
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          {result ? (
            /* Results Screen */
            <div>
              <div className="text-center pb-8 border-b border-gray-200 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
                <p className="text-3xl font-extrabold text-blue-600 mb-2">
                  {result.attempt.score} / {result.attempt.total_questions}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Score:{' '}
                  {Math.round((result.attempt.score / result.attempt.total_questions) * 100)}%
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setAnswers({});
                      setResult(null);
                    }}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => {
                      setQuiz(null);
                      setResult(null);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    Back to All Quizzes
                  </button>
                </div>
              </div>

              {/* Detailed Review */}
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Question Review</h3>
              <div className="space-y-6">
                {result.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-xl border ${
                      q.is_correct
                        ? 'border-green-200 bg-green-50/40'
                        : 'border-red-200 bg-red-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="font-semibold text-gray-900 text-sm">
                        {idx + 1}. {q.question_text}
                      </p>
                      {q.is_correct ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 shrink-0">
                          <CheckCircle2 size={14} /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 shrink-0">
                          <XCircle size={14} /> Incorrect
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2 mb-3">
                      {q.options.map((opt) => {
                        const isChosen = q.selected_option === opt;
                        const isCorrect = q.correct_answer === opt;
                        let style = 'border-gray-200 bg-white text-gray-700';
                        if (isCorrect) {
                          style = 'border-green-500 bg-green-100 text-green-900 font-medium';
                        } else if (isChosen && !isCorrect) {
                          style = 'border-red-500 bg-red-100 text-red-900 line-through';
                        }
                        return (
                          <div
                            key={opt}
                            className={`p-2.5 text-xs rounded-lg border flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {isCorrect && (
                              <span className="text-[11px] font-bold text-green-700 uppercase">
                                Correct Answer
                              </span>
                            )}
                            {isChosen && !isCorrect && (
                              <span className="text-[11px] font-bold text-red-700 uppercase">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                        <span className="font-semibold text-gray-800">Explanation:</span>{' '}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Solving Mode */
            <>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">{quiz.title}</h2>
              <p className="text-xs text-gray-500 mb-6">
                Answer all questions and submit to view your grade and AI explanations.
              </p>

              <div className="space-y-8">
                {quiz.questions.map((q, i) => (
                  <div key={q.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <p className="font-semibold text-gray-900 mb-4 text-sm">
                      {i + 1}. {q.question_text}
                    </p>
                    <div className="grid gap-2.5">
                      {q.options.map((o) => (
                        <label
                          key={o}
                          className={`p-3 text-sm border rounded-lg cursor-pointer transition-all flex items-center ${
                            answers[q.id] === o
                              ? 'bg-blue-50 border-blue-600 text-blue-900 font-medium'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id] === o}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          {o}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <button
                  onClick={submit}
                  disabled={busy || Object.keys(answers).length !== quiz.questions.length}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm text-sm"
                >
                  {busy
                    ? 'Submitting & Grading...'
                    : `Submit Quiz (${Object.keys(answers).length}/${quiz.questions.length} Answered)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

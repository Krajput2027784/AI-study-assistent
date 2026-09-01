import { useState } from 'react';
import { BrainCircuit, CheckCircle, XCircle } from 'lucide-react';

export default function QuizGenerator() {
  const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [score, setScore] = useState(0);

  const questions = [
    { q: 'What is the powerhouse of the cell?', a: ['Nucleus', 'Mitochondria', 'Ribosome'], correct: 1 },
    { q: 'What is 2 + 2?', a: ['3', '4', '5'], correct: 1 }
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-gray-900"><BrainCircuit /> Quiz Generator</h1>
      
      {step === 'setup' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Configure Your Quiz</h2>
          <button onClick={() => setStep('quiz')} className="w-full py-3 bg-blue-600 text-white rounded-lg">Generate & Start</button>
        </div>
      )}

      {step === 'quiz' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <p className="text-lg font-medium mb-6">{questions[0].q}</p>
          <div className="space-y-3">
            {questions[0].a.map((opt, i) => (
              <button key={i} onClick={() => { setScore(1); setStep('result'); }} className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50">{opt}</button>
            ))}
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
          <p className="text-xl mb-6">Your Score: {score} / 1</p>
          <button onClick={() => setStep('setup')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Back to Setup</button>
        </div>
      )}
    </div>
  );
}

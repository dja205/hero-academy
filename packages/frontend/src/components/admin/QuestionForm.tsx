import { useState } from 'react';

interface QuestionFormData {
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionFormProps {
  initial?: Partial<QuestionFormData>;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  topics: { id: string; name: string }[];
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionForm({ initial, onSubmit, onCancel, topics }: QuestionFormProps) {
  const [text, setText] = useState(initial?.text || '');
  const [options, setOptions] = useState<[string, string, string, string]>(
    initial?.options || ['', '', '', ''],
  );
  const [correctIndex, setCorrectIndex] = useState<0 | 1 | 2 | 3>(
    initial?.correctIndex ?? 0,
  );
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initial?.difficulty || 'easy',
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options] as [string, string, string, string];
    next[index] = value;
    setOptions(next);
  };

  const validate = (): string | null => {
    if (!text.trim()) return 'Question text is required';
    if (options.some((o) => !o.trim())) return 'All four options are required';
    if (!explanation.trim()) return 'Explanation is required';
    if (!topicId) return 'Topic is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        text: text.trim(),
        options,
        correctIndex,
        explanation: explanation.trim(),
        topicId,
        difficulty,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save question';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Option {OPTION_LABELS[i]}
              {i === correctIndex && (
                <span className="text-green-600 ml-1">✓ Correct</span>
              )}
            </label>
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
        <div className="flex gap-2">
          {OPTION_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCorrectIndex(i as 0 | 1 | 2 | 3)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                correctIndex === i
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            required
          >
            <option value="">Select topic…</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      {/* Live preview */}
      {text.trim() && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Preview</h4>
          <p className="text-gray-900 font-medium mb-3">{text}</p>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  i === correctIndex
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                <span className="font-medium mr-2">{OPTION_LABELS[i]}.</span>
                {opt || '—'}
              </div>
            ))}
          </div>
          {explanation.trim() && (
            <p className="mt-3 text-sm text-gray-600 italic">💡 {explanation}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : initial ? 'Update Question' : 'Create Question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

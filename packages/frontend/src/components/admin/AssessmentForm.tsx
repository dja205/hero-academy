import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';

interface AssessmentFormData {
  title: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionIds: string[];
}

interface Question {
  id: string;
  text: string;
  topicId: string;
  difficulty: string;
}

interface AssessmentFormProps {
  initial?: Partial<AssessmentFormData>;
  onSubmit: (data: AssessmentFormData) => Promise<void>;
  onCancel: () => void;
  topics: { id: string; name: string }[];
}

export function AssessmentForm({ initial, onSubmit, onCancel, topics }: AssessmentFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initial?.difficulty || 'easy',
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.questionIds || []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qFilter, setQFilter] = useState({ topic: '', difficulty: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);

  useEffect(() => {
    setLoadingQ(true);
    adminApi
      .getQuestions({
        limit: 200,
        topicId: qFilter.topic || undefined,
        difficulty: qFilter.difficulty || undefined,
      })
      .then((res) => setQuestions(res.questions))
      .catch(() => {})
      .finally(() => setLoadingQ(false));
  }, [qFilter.topic, qFilter.difficulty]);

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIds = [...selectedIds];
    const target = index + direction;
    if (target < 0 || target >= newIds.length) return;
    [newIds[index], newIds[target]] = [newIds[target], newIds[index]];
    setSelectedIds(newIds);
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (!topicId) return 'Topic is required';
    if (selectedIds.length === 0) return 'Select at least one question';
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
        title: title.trim(),
        topicId,
        difficulty,
        questionIds: selectedIds,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save assessment';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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

      {/* Selected questions with ordering */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Selected Questions ({selectedIds.length})
        </h4>
        {selectedIds.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">
            No questions selected yet. Pick from the bank below.
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {selectedIds.map((id, i) => {
              const q = questions.find((x) => x.id === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 text-sm bg-indigo-50 rounded px-2 py-1"
                >
                  <span className="text-gray-400 w-5 text-right">{i + 1}.</span>
                  <span className="flex-1 text-gray-900 truncate">{q?.text || id}</span>
                  <button
                    type="button"
                    onClick={() => moveQuestion(i, -1)}
                    disabled={i === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(i, 1)}
                    disabled={i === selectedIds.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleQuestion(id)}
                    className="text-red-400 hover:text-red-600 px-1"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question bank */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Question Bank</h4>
        <div className="flex gap-2 mb-2">
          <select
            value={qFilter.topic}
            onChange={(e) => setQFilter((f) => ({ ...f, topic: e.target.value }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded text-gray-700"
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={qFilter.difficulty}
            onChange={(e) => setQFilter((f) => ({ ...f, difficulty: e.target.value }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded text-gray-700"
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {loadingQ ? (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">Loading questions…</p>
          ) : questions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">No questions found</p>
          ) : (
            questions.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              return (
                <label
                  key={q.id}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestion(q.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex-1 text-gray-900 truncate">{q.text}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      q.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : q.difficulty === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : initial ? 'Update Assessment' : 'Create Assessment'}
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

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { apiClient } from '../../api/client';
import { DataTable } from '../../components/admin/DataTable';
import { QuestionForm } from '../../components/admin/QuestionForm';

interface Question {
  id: string;
  topicId: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: string;
  active: boolean;
  createdAt?: string;
}

interface Topic {
  id: string;
  name: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getQuestions({
        page,
        limit: 20,
        topicId: filterTopic || undefined,
        difficulty: filterDifficulty || undefined,
      });
      let filtered = data.questions.map((q) => ({
        ...q,
        options: q.options as unknown as [string, string, string, string],
      }));
      if (filterActive === 'true') filtered = filtered.filter((q) => q.active);
      if (filterActive === 'false') filtered = filtered.filter((q) => !q.active);
      setQuestions(filtered);
      setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
    } catch {
      /* handled by apiClient */
    } finally {
      setLoading(false);
    }
  }, [page, filterTopic, filterDifficulty, filterActive]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    // Load topics for filter/form dropdowns
    apiClient
      .get<{ topics: Topic[] }>('/topics')
      .then((d) => setTopics(d.topics))
      .catch(() => {});
  }, []);

  const handleCreate = async (data: {
    text: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string;
    topicId: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    await adminApi.createQuestion(data);
    setShowForm(false);
    await loadQuestions();
  };

  const handleUpdate = async (data: {
    text: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string;
    topicId: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    if (!editingQuestion) return;
    await adminApi.updateQuestion(editingQuestion.id, data);
    setEditingQuestion(null);
    await loadQuestions();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await adminApi.deleteQuestion(deleteConfirm);
    setDeleteConfirm(null);
    await loadQuestions();
  };

  const topicName = (id: string) => topics.find((t) => t.id === id)?.name || id;

  if (showForm || editingQuestion) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {editingQuestion ? 'Edit Question' : 'New Question'}
        </h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <QuestionForm
            initial={
              editingQuestion
                ? {
                    text: editingQuestion.text,
                    options: editingQuestion.options,
                    correctIndex: editingQuestion.correctIndex as 0 | 1 | 2 | 3,
                    explanation: editingQuestion.explanation,
                    topicId: editingQuestion.topicId,
                    difficulty: editingQuestion.difficulty as 'easy' | 'medium' | 'hard',
                  }
                : undefined
            }
            onSubmit={editingQuestion ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingQuestion(null);
            }}
            topics={topics}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Questions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterTopic}
          onChange={(e) => {
            setFilterTopic(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => {
            setFilterDifficulty(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={filterActive}
          onChange={(e) => {
            setFilterActive(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
        >
          <option value="">Active & Inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading…</p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'text',
              header: 'Question',
              sortable: true,
              className: 'max-w-xs',
              render: (q) => (
                <span className="truncate block max-w-xs" title={String(q.text)}>
                  {String(q.text).length > 60
                    ? String(q.text).slice(0, 60) + '…'
                    : String(q.text)}
                </span>
              ),
            },
            {
              key: 'topicId',
              header: 'Topic',
              render: (q) => topicName(String(q.topicId)),
            },
            {
              key: 'difficulty',
              header: 'Difficulty',
              sortable: true,
              render: (q) => {
                const d = String(q.difficulty);
                const color =
                  d === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : d === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700';
                return (
                  <span className={`text-xs px-2 py-0.5 rounded ${color}`}>{d}</span>
                );
              },
            },
            {
              key: 'active',
              header: 'Status',
              render: (q) =>
                q.active ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    Inactive
                  </span>
                ),
            },
            {
              key: 'actions',
              header: '',
              render: (q) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setPreviewQuestion(q as unknown as Question)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setEditingQuestion(q as unknown as Question)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(String(q.id))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={questions as unknown as Record<string, unknown>[]}
          keyField="id"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No questions found"
        />
      )}

      {/* Question Preview Modal */}
      {previewQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreviewQuestion(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-gray-500 mb-3">Question Preview</h3>
            <p className="text-gray-900 font-medium mb-4">{previewQuestion.text}</p>
            <div className="space-y-2">
              {previewQuestion.options.map((opt, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    i === previewQuestion.correctIndex
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="font-medium mr-2">{OPTION_LABELS[i]}.</span>
                  {opt}
                </div>
              ))}
            </div>
            {previewQuestion.explanation && (
              <p className="mt-3 text-sm text-gray-600 italic">
                💡 {previewQuestion.explanation}
              </p>
            )}
            <button
              onClick={() => setPreviewQuestion(null)}
              className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Question?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This will soft-delete the question. It can be restored later.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

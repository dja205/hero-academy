import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { apiClient } from '../../api/client';
import { DataTable } from '../../components/admin/DataTable';
import { AssessmentForm } from '../../components/admin/AssessmentForm';

interface Assessment {
  id: string;
  topicId: string;
  title: string;
  difficulty: string;
  questionIds: string[];
  order: number;
  active: boolean;
}

interface Topic {
  id: string;
  name: string;
}

interface QuestionItem {
  id: string;
  text: string;
}

export function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [previewAssessment, setPreviewAssessment] = useState<Assessment | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<QuestionItem[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAssessments({ page, limit: 20 });
      setAssessments(data.assessments);
      setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    apiClient
      .get<{ topics: Topic[] }>('/topics')
      .then((d) => setTopics(d.topics))
      .catch(() => {});
  }, []);

  const handleCreate = async (data: {
    title: string;
    topicId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionIds: string[];
  }) => {
    await adminApi.createAssessment(data);
    setShowForm(false);
    await loadAssessments();
  };

  const handleUpdate = async (data: {
    title: string;
    topicId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionIds: string[];
  }) => {
    if (!editingAssessment) return;
    await adminApi.updateAssessment(editingAssessment.id, data);
    setEditingAssessment(null);
    await loadAssessments();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await adminApi.deleteAssessment(deleteConfirm);
    setDeleteConfirm(null);
    await loadAssessments();
  };

  const handlePreview = async (assessment: Assessment) => {
    setPreviewAssessment(assessment);
    try {
      const data = await adminApi.getQuestions({ limit: 200 });
      const qMap = new Map(data.questions.map((q) => [q.id, q]));
      setPreviewQuestions(
        assessment.questionIds.map((id) => {
          const q = qMap.get(id);
          return q ? { id: q.id, text: q.text } : { id, text: 'Question ' + id };
        }),
      );
    } catch {
      setPreviewQuestions(
        assessment.questionIds.map((id) => ({ id, text: 'Question ' + id })),
      );
    }
  };

  const topicName = (id: string) => topics.find((t) => t.id === id)?.name || id;

  if (showForm || editingAssessment) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {editingAssessment ? 'Edit Assessment' : 'New Assessment'}
        </h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <AssessmentForm
            initial={
              editingAssessment
                ? {
                    title: editingAssessment.title,
                    topicId: editingAssessment.topicId,
                    difficulty: editingAssessment.difficulty as 'easy' | 'medium' | 'hard',
                    questionIds: editingAssessment.questionIds,
                  }
                : undefined
            }
            onSubmit={editingAssessment ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingAssessment(null);
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
        <h1 className="text-xl font-bold text-gray-900">Assessments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Assessment
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'title', header: 'Title', sortable: true },
            {
              key: 'topicId',
              header: 'Topic',
              render: (a) => topicName(String(a.topicId)),
            },
            {
              key: 'difficulty',
              header: 'Difficulty',
              sortable: true,
              render: (a) => {
                const d = String(a.difficulty);
                const color =
                  d === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : d === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700';
                return <span className={`text-xs px-2 py-0.5 rounded ${color}`}>{d}</span>;
              },
            },
            {
              key: 'questionIds',
              header: 'Questions',
              render: (a) => {
                const ids = a.questionIds as unknown;
                return String(Array.isArray(ids) ? ids.length : 0);
              },
            },
            {
              key: 'active',
              header: 'Status',
              render: (a) =>
                a.active ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Active</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">Inactive</span>
                ),
            },
            {
              key: 'actions',
              header: '',
              render: (a) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePreview(a as unknown as Assessment)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setEditingAssessment(a as unknown as Assessment)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(String(a.id))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={assessments as unknown as Record<string, unknown>[]}
          keyField="id"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No assessments found"
        />
      )}

      {/* Preview Modal */}
      {previewAssessment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreviewAssessment(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {previewAssessment.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {topicName(previewAssessment.topicId)} &middot; {previewAssessment.difficulty} &middot;{' '}
              {previewAssessment.questionIds.length} questions
            </p>
            <div className="space-y-3">
              {previewQuestions.map((q, i) => (
                <div key={q.id} className="flex gap-2 text-sm">
                  <span className="text-gray-400 shrink-0">{i + 1}.</span>
                  <span className="text-gray-900">{q.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPreviewAssessment(null)}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Assessment?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This will soft-delete the assessment. It can be restored later.
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

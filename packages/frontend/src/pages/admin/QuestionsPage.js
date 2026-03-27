import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { apiClient } from '../../api/client';
import { DataTable } from '../../components/admin/DataTable';
import { QuestionForm } from '../../components/admin/QuestionForm';
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
export function QuestionsPage() {
    const [questions, setQuestions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterTopic, setFilterTopic] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterActive, setFilterActive] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [previewQuestion, setPreviewQuestion] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
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
                options: q.options,
            }));
            if (filterActive === 'true')
                filtered = filtered.filter((q) => q.active);
            if (filterActive === 'false')
                filtered = filtered.filter((q) => !q.active);
            setQuestions(filtered);
            setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
        }
        catch {
            /* handled by apiClient */
        }
        finally {
            setLoading(false);
        }
    }, [page, filterTopic, filterDifficulty, filterActive]);
    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);
    useEffect(() => {
        // Load topics for filter/form dropdowns
        apiClient
            .get('/topics')
            .then((d) => setTopics(d.topics))
            .catch(() => { });
    }, []);
    const handleCreate = async (data) => {
        await adminApi.createQuestion(data);
        setShowForm(false);
        await loadQuestions();
    };
    const handleUpdate = async (data) => {
        if (!editingQuestion)
            return;
        await adminApi.updateQuestion(editingQuestion.id, data);
        setEditingQuestion(null);
        await loadQuestions();
    };
    const handleDelete = async () => {
        if (!deleteConfirm)
            return;
        await adminApi.deleteQuestion(deleteConfirm);
        setDeleteConfirm(null);
        await loadQuestions();
    };
    const topicName = (id) => topics.find((t) => t.id === id)?.name || id;
    if (showForm || editingQuestion) {
        return (_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900 mb-6", children: editingQuestion ? 'Edit Question' : 'New Question' }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: _jsx(QuestionForm, { initial: editingQuestion
                            ? {
                                text: editingQuestion.text,
                                options: editingQuestion.options,
                                correctIndex: editingQuestion.correctIndex,
                                explanation: editingQuestion.explanation,
                                topicId: editingQuestion.topicId,
                                difficulty: editingQuestion.difficulty,
                            }
                            : undefined, onSubmit: editingQuestion ? handleUpdate : handleCreate, onCancel: () => {
                            setShowForm(false);
                            setEditingQuestion(null);
                        }, topics: topics }) })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Questions" }), _jsx("button", { onClick: () => setShowForm(true), className: "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors", children: "+ New Question" })] }), _jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [_jsxs("select", { value: filterTopic, onChange: (e) => {
                            setFilterTopic(e.target.value);
                            setPage(1);
                        }, className: "px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700", children: [_jsx("option", { value: "", children: "All topics" }), topics.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] }), _jsxs("select", { value: filterDifficulty, onChange: (e) => {
                            setFilterDifficulty(e.target.value);
                            setPage(1);
                        }, className: "px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700", children: [_jsx("option", { value: "", children: "All difficulties" }), _jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] }), _jsxs("select", { value: filterActive, onChange: (e) => {
                            setFilterActive(e.target.value);
                            setPage(1);
                        }, className: "px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700", children: [_jsx("option", { value: "", children: "Active & Inactive" }), _jsx("option", { value: "true", children: "Active only" }), _jsx("option", { value: "false", children: "Inactive only" })] })] }), loading ? (_jsx("p", { className: "text-gray-500 py-8 text-center", children: "Loading\u2026" })) : (_jsx(DataTable, { columns: [
                    {
                        key: 'text',
                        header: 'Question',
                        sortable: true,
                        className: 'max-w-xs',
                        render: (q) => (_jsx("span", { className: "truncate block max-w-xs", title: String(q.text), children: String(q.text).length > 60
                                ? String(q.text).slice(0, 60) + '…'
                                : String(q.text) })),
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
                            const color = d === 'easy'
                                ? 'bg-green-100 text-green-700'
                                : d === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700';
                            return (_jsx("span", { className: `text-xs px-2 py-0.5 rounded ${color}`, children: d }));
                        },
                    },
                    {
                        key: 'active',
                        header: 'Status',
                        render: (q) => q.active ? (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-green-100 text-green-700", children: "Active" })) : (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500", children: "Inactive" })),
                    },
                    {
                        key: 'actions',
                        header: '',
                        render: (q) => (_jsxs("div", { className: "flex gap-2", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { onClick: () => setPreviewQuestion(q), className: "text-xs text-indigo-600 hover:text-indigo-800", children: "Preview" }), _jsx("button", { onClick: () => setEditingQuestion(q), className: "text-xs text-gray-600 hover:text-gray-800", children: "Edit" }), _jsx("button", { onClick: () => setDeleteConfirm(String(q.id)), className: "text-xs text-red-600 hover:text-red-800", children: "Delete" })] })),
                    },
                ], data: questions, keyField: "id", page: page, totalPages: totalPages, onPageChange: setPage, emptyMessage: "No questions found" })), previewQuestion && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setPreviewQuestion(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-3", children: "Question Preview" }), _jsx("p", { className: "text-gray-900 font-medium mb-4", children: previewQuestion.text }), _jsx("div", { className: "space-y-2", children: previewQuestion.options.map((opt, i) => (_jsxs("div", { className: `px-3 py-2 rounded-lg border text-sm ${i === previewQuestion.correctIndex
                                    ? 'border-green-300 bg-green-50 text-green-800'
                                    : 'border-gray-200 text-gray-700'}`, children: [_jsxs("span", { className: "font-medium mr-2", children: [OPTION_LABELS[i], "."] }), opt] }, i))) }), previewQuestion.explanation && (_jsxs("p", { className: "mt-3 text-sm text-gray-600 italic", children: ["\uD83D\uDCA1 ", previewQuestion.explanation] })), _jsx("button", { onClick: () => setPreviewQuestion(null), className: "mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: "Close" })] }) })), deleteConfirm && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setDeleteConfirm(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Delete Question?" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "This will soft-delete the question. It can be restored later." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleDelete, className: "px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700", children: "Delete" }), _jsx("button", { onClick: () => setDeleteConfirm(null), className: "px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200", children: "Cancel" })] })] }) }))] }));
}

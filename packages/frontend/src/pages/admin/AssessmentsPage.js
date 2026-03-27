import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { apiClient } from '../../api/client';
import { DataTable } from '../../components/admin/DataTable';
import { AssessmentForm } from '../../components/admin/AssessmentForm';
export function AssessmentsPage() {
    const [assessments, setAssessments] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState(null);
    const [previewAssessment, setPreviewAssessment] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const loadAssessments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAssessments({ page, limit: 20 });
            setAssessments(data.assessments);
            setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
        }
        catch {
            /* handled */
        }
        finally {
            setLoading(false);
        }
    }, [page]);
    useEffect(() => {
        loadAssessments();
    }, [loadAssessments]);
    useEffect(() => {
        apiClient
            .get('/topics')
            .then((d) => setTopics(d.topics))
            .catch(() => { });
    }, []);
    const handleCreate = async (data) => {
        await adminApi.createAssessment(data);
        setShowForm(false);
        await loadAssessments();
    };
    const handleUpdate = async (data) => {
        if (!editingAssessment)
            return;
        await adminApi.updateAssessment(editingAssessment.id, data);
        setEditingAssessment(null);
        await loadAssessments();
    };
    const handleDelete = async () => {
        if (!deleteConfirm)
            return;
        await adminApi.deleteAssessment(deleteConfirm);
        setDeleteConfirm(null);
        await loadAssessments();
    };
    const handlePreview = async (assessment) => {
        setPreviewAssessment(assessment);
        try {
            const data = await adminApi.getQuestions({ limit: 200 });
            const qMap = new Map(data.questions.map((q) => [q.id, q]));
            setPreviewQuestions(assessment.questionIds.map((id) => {
                const q = qMap.get(id);
                return q ? { id: q.id, text: q.text } : { id, text: 'Question ' + id };
            }));
        }
        catch {
            setPreviewQuestions(assessment.questionIds.map((id) => ({ id, text: 'Question ' + id })));
        }
    };
    const topicName = (id) => topics.find((t) => t.id === id)?.name || id;
    if (showForm || editingAssessment) {
        return (_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900 mb-6", children: editingAssessment ? 'Edit Assessment' : 'New Assessment' }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: _jsx(AssessmentForm, { initial: editingAssessment
                            ? {
                                title: editingAssessment.title,
                                topicId: editingAssessment.topicId,
                                difficulty: editingAssessment.difficulty,
                                questionIds: editingAssessment.questionIds,
                            }
                            : undefined, onSubmit: editingAssessment ? handleUpdate : handleCreate, onCancel: () => {
                            setShowForm(false);
                            setEditingAssessment(null);
                        }, topics: topics }) })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Assessments" }), _jsx("button", { onClick: () => setShowForm(true), className: "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors", children: "+ New Assessment" })] }), loading ? (_jsx("p", { className: "text-gray-500 py-8 text-center", children: "Loading..." })) : (_jsx(DataTable, { columns: [
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
                            const color = d === 'easy'
                                ? 'bg-green-100 text-green-700'
                                : d === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700';
                            return _jsx("span", { className: `text-xs px-2 py-0.5 rounded ${color}`, children: d });
                        },
                    },
                    {
                        key: 'questionIds',
                        header: 'Questions',
                        render: (a) => {
                            const ids = a.questionIds;
                            return String(Array.isArray(ids) ? ids.length : 0);
                        },
                    },
                    {
                        key: 'active',
                        header: 'Status',
                        render: (a) => a.active ? (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-green-100 text-green-700", children: "Active" })) : (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500", children: "Inactive" })),
                    },
                    {
                        key: 'actions',
                        header: '',
                        render: (a) => (_jsxs("div", { className: "flex gap-2", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { onClick: () => handlePreview(a), className: "text-xs text-indigo-600 hover:text-indigo-800", children: "Preview" }), _jsx("button", { onClick: () => setEditingAssessment(a), className: "text-xs text-gray-600 hover:text-gray-800", children: "Edit" }), _jsx("button", { onClick: () => setDeleteConfirm(String(a.id)), className: "text-xs text-red-600 hover:text-red-800", children: "Delete" })] })),
                    },
                ], data: assessments, keyField: "id", page: page, totalPages: totalPages, onPageChange: setPage, emptyMessage: "No assessments found" })), previewAssessment && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setPreviewAssessment(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-1", children: previewAssessment.title }), _jsxs("p", { className: "text-sm text-gray-500 mb-4", children: [topicName(previewAssessment.topicId), " \u00B7 ", previewAssessment.difficulty, " \u00B7", ' ', previewAssessment.questionIds.length, " questions"] }), _jsx("div", { className: "space-y-3", children: previewQuestions.map((q, i) => (_jsxs("div", { className: "flex gap-2 text-sm", children: [_jsxs("span", { className: "text-gray-400 shrink-0", children: [i + 1, "."] }), _jsx("span", { className: "text-gray-900", children: q.text })] }, q.id))) }), _jsx("button", { onClick: () => setPreviewAssessment(null), className: "mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: "Close" })] }) })), deleteConfirm && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setDeleteConfirm(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Delete Assessment?" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "This will soft-delete the assessment. It can be restored later." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleDelete, className: "px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700", children: "Delete" }), _jsx("button", { onClick: () => setDeleteConfirm(null), className: "px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200", children: "Cancel" })] })] }) }))] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
export function AssessmentForm({ initial, onSubmit, onCancel, topics }) {
    const [title, setTitle] = useState(initial?.title || '');
    const [topicId, setTopicId] = useState(initial?.topicId || '');
    const [difficulty, setDifficulty] = useState(initial?.difficulty || 'easy');
    const [selectedIds, setSelectedIds] = useState(initial?.questionIds || []);
    const [questions, setQuestions] = useState([]);
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
            .catch(() => { })
            .finally(() => setLoadingQ(false));
    }, [qFilter.topic, qFilter.difficulty]);
    const toggleQuestion = (id) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };
    const moveQuestion = (index, direction) => {
        const newIds = [...selectedIds];
        const target = index + direction;
        if (target < 0 || target >= newIds.length)
            return;
        [newIds[index], newIds[target]] = [newIds[target], newIds[index]];
        setSelectedIds(newIds);
    };
    const validate = () => {
        if (!title.trim())
            return 'Title is required';
        if (!topicId)
            return 'Topic is required';
        if (selectedIds.length === 0)
            return 'Select at least one question';
        return null;
    };
    const handleSubmit = async (e) => {
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
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to save assessment';
            setError(message);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "assessment-title", className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { id: "assessment-title", type: "text", value: title, onChange: (e) => setTitle(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "assessment-topic", className: "block text-sm font-medium text-gray-700 mb-1", children: "Topic" }), _jsxs("select", { id: "assessment-topic", value: topicId, onChange: (e) => setTopicId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", required: true, children: [_jsx("option", { value: "", children: "Select topic\u2026" }), topics.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "assessment-difficulty", className: "block text-sm font-medium text-gray-700 mb-1", children: "Difficulty" }), _jsxs("select", { id: "assessment-difficulty", value: difficulty, onChange: (e) => setDifficulty(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", children: [_jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: ["Selected Questions (", selectedIds.length, ")"] }), selectedIds.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500 py-2", children: "No questions selected yet. Pick from the bank below." })) : (_jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2", children: selectedIds.map((id, i) => {
                            const q = questions.find((x) => x.id === id);
                            return (_jsxs("div", { className: "flex items-center gap-2 text-sm bg-indigo-50 rounded px-2 py-1", children: [_jsxs("span", { className: "text-gray-400 w-5 text-right", children: [i + 1, "."] }), _jsx("span", { className: "flex-1 text-gray-900 truncate", children: q?.text || id }), _jsx("button", { type: "button", onClick: () => moveQuestion(i, -1), disabled: i === 0, className: "text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1", children: "\u2191" }), _jsx("button", { type: "button", onClick: () => moveQuestion(i, 1), disabled: i === selectedIds.length - 1, className: "text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1", children: "\u2193" }), _jsx("button", { type: "button", onClick: () => toggleQuestion(id), className: "text-red-400 hover:text-red-600 px-1", children: "\u2715" })] }, id));
                        }) }))] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: "Question Bank" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsxs("select", { value: qFilter.topic, onChange: (e) => setQFilter((f) => ({ ...f, topic: e.target.value })), className: "px-2 py-1 text-sm border border-gray-300 rounded text-gray-700", children: [_jsx("option", { value: "", children: "All topics" }), topics.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] }), _jsxs("select", { value: qFilter.difficulty, onChange: (e) => setQFilter((f) => ({ ...f, difficulty: e.target.value })), className: "px-2 py-1 text-sm border border-gray-300 rounded text-gray-700", children: [_jsx("option", { value: "", children: "All difficulties" }), _jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] })] }), _jsx("div", { className: "max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100", children: loadingQ ? (_jsx("p", { className: "px-3 py-4 text-sm text-gray-500 text-center", children: "Loading questions\u2026" })) : questions.length === 0 ? (_jsx("p", { className: "px-3 py-4 text-sm text-gray-500 text-center", children: "No questions found" })) : (questions.map((q) => {
                            const isSelected = selectedIds.includes(q.id);
                            return (_jsxs("label", { className: `flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`, children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => toggleQuestion(q.id), className: "rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" }), _jsx("span", { className: "flex-1 text-gray-900 truncate", children: q.text }), _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded ${q.difficulty === 'easy'
                                            ? 'bg-green-100 text-green-700'
                                            : q.difficulty === 'medium'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-red-100 text-red-700'}`, children: q.difficulty })] }, q.id));
                        })) })] }), error && _jsx("p", { className: "text-sm text-red-600 bg-red-50 p-2 rounded", children: error }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { type: "submit", disabled: submitting, className: "px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: submitting ? 'Saving…' : initial ? 'Update Assessment' : 'Create Assessment' }), _jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors", children: "Cancel" })] })] }));
}

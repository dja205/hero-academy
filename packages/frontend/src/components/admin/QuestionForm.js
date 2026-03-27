import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
export function QuestionForm({ initial, onSubmit, onCancel, topics }) {
    const [text, setText] = useState(initial?.text || '');
    const [options, setOptions] = useState(initial?.options || ['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
    const [explanation, setExplanation] = useState(initial?.explanation || '');
    const [topicId, setTopicId] = useState(initial?.topicId || '');
    const [difficulty, setDifficulty] = useState(initial?.difficulty || 'easy');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleOptionChange = (index, value) => {
        const next = [...options];
        next[index] = value;
        setOptions(next);
    };
    const validate = () => {
        if (!text.trim())
            return 'Question text is required';
        if (options.some((o) => !o.trim()))
            return 'All four options are required';
        if (!explanation.trim())
            return 'Explanation is required';
        if (!topicId)
            return 'Topic is required';
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
                text: text.trim(),
                options,
                correctIndex,
                explanation: explanation.trim(),
                topicId,
                difficulty,
            });
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to save question';
            setError(message);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "question-text", className: "block text-sm font-medium text-gray-700 mb-1", children: "Question Text" }), _jsx("textarea", { id: "question-text", value: text, onChange: (e) => setText(e.target.value), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", required: true })] }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: options.map((opt, i) => (_jsxs("div", { children: [_jsxs("label", { htmlFor: `question-option-${i}`, className: "block text-sm font-medium text-gray-700 mb-1", children: ["Option ", OPTION_LABELS[i], i === correctIndex && (_jsx("span", { className: "text-green-600 ml-1", children: "\u2713 Correct" }))] }), _jsx("input", { id: `question-option-${i}`, type: "text", value: opt, onChange: (e) => handleOptionChange(i, e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", required: true })] }, i))) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Correct Answer" }), _jsx("div", { className: "flex gap-2", children: OPTION_LABELS.map((label, i) => (_jsx("button", { type: "button", onClick: () => setCorrectIndex(i), className: `px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${correctIndex === i
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'}`, children: label }, i))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "question-explanation", className: "block text-sm font-medium text-gray-700 mb-1", children: "Explanation" }), _jsx("textarea", { id: "question-explanation", value: explanation, onChange: (e) => setExplanation(e.target.value), rows: 2, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "question-topic", className: "block text-sm font-medium text-gray-700 mb-1", children: "Topic" }), _jsxs("select", { id: "question-topic", value: topicId, onChange: (e) => setTopicId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", required: true, children: [_jsx("option", { value: "", children: "Select topic\u2026" }), topics.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "question-difficulty", className: "block text-sm font-medium text-gray-700 mb-1", children: "Difficulty" }), _jsxs("select", { id: "question-difficulty", value: difficulty, onChange: (e) => setDifficulty(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", children: [_jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] })] })] }), error && _jsx("p", { className: "text-sm text-red-600 bg-red-50 p-2 rounded", children: error }), text.trim() && (_jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("h4", { className: "text-sm font-medium text-gray-500 mb-2", children: "Preview" }), _jsx("p", { className: "text-gray-900 font-medium mb-3", children: text }), _jsx("div", { className: "space-y-2", children: options.map((opt, i) => (_jsxs("div", { className: `px-3 py-2 rounded-lg border text-sm ${i === correctIndex
                                ? 'border-green-300 bg-green-50 text-green-800'
                                : 'border-gray-200 text-gray-700'}`, children: [_jsxs("span", { className: "font-medium mr-2", children: [OPTION_LABELS[i], "."] }), opt || '—'] }, i))) }), explanation.trim() && (_jsxs("p", { className: "mt-3 text-sm text-gray-600 italic", children: ["\uD83D\uDCA1 ", explanation] }))] })), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { type: "submit", disabled: submitting, className: "px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: submitting ? 'Saving…' : initial ? 'Update Question' : 'Create Question' }), _jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors", children: "Cancel" })] })] }));
}

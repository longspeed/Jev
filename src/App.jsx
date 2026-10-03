import { useState } from 'react';
import './App.css';

export default function App() {
  const [state, setState] = useState('');
  const [questions, setQuestions] = useState([
    { id: 'q1', type: 'choice', instructions: '', criteria: '' },
  ]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addQuestion() {
    setQuestions([...questions, { id: `q${Date.now()}`, type: 'noul', instructions: '', criteria: '' }]);
  }

  function removeQuestion(id) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  function updateQuestion(id, field, value) {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  async function callJev() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const reqQuestions = {};
      for (const q of questions) {
        const question = { type: q.type, instructions: q.instructions };
        if ((q.type === 'choice' || q.type === 'noul') && q.criteria.trim()) {
          question.criteria = {};
          q.criteria.split('\n').filter(Boolean).forEach((line) => {
            const [key, ...rest] = line.split(':');
            if (key && rest.length) {
              question.criteria[key.trim()] = rest.join(':').trim();
            }
          });
        }
        if (q.type === 'score' && q.criteria.trim()) {
          question.criteria = q.criteria.split('\n').filter(Boolean);
        }
        reqQuestions[q.id] = question;
      }

      const response = await fetch('/api/v1/systemone', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_TYPESAFE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: state,
          model: 'jev-latest',
          questions: reqQuestions,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Jev</h1>
      <p className="subtitle">TypeSafe AI — System One Model</p>

      <div className="section">
        <span className="label">State</span>
        <textarea
          placeholder="Describe the situation or context for Jev to evaluate..."
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
      </div>

      <div className="section">
        <span className="label">Questions</span>
        {questions.map((q) => (
          <div key={q.id} className="question-row">
            <select
              value={q.type}
              onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
            >
              <option value="choice">Choice</option>
              <option value="score">Score</option>
              <option value="noul">Noul</option>
            </select>
            <input
              type="text"
              placeholder="Ask a question about the state..."
              value={q.instructions}
              onChange={(e) => updateQuestion(q.id, 'instructions', e.target.value)}
            />
            {q.type === 'choice' && (
              <input
                type="text"
                placeholder="Criteria: key1: desc&#10;key2: desc"
                value={q.criteria}
                onChange={(e) => updateQuestion(q.id, 'criteria', e.target.value)}
                title="One per line, format: key: description"
              />
            )}
            {q.type === 'score' && (
              <input
                type="text"
                placeholder="Levels, one per line"
                value={q.criteria}
                onChange={(e) => updateQuestion(q.id, 'criteria', e.target.value)}
              />
            )}
            <button className="remove-btn" onClick={() => removeQuestion(q.id)}>✕</button>
          </div>
        ))}
        <div className="btn-row">
          <button className="add-btn" onClick={addQuestion}>+ Add Question</button>
        </div>
      </div>

      <button className="call-btn" onClick={callJev} disabled={loading}>
        {loading ? 'Evaluating...' : 'Call Jev'}
      </button>

      {error && <div className="result error"><pre>{error}</pre></div>}

      {result && (
        <div className="result">
          <h3>Response</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

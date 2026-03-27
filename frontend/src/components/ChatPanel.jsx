import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../api';

const PLACEHOLDER_PROMPTS = [
  'Am I eligible to CODO into CS?',
  'What GPA do I need to switch to CS?',
  'I got a C in CS 18000 — does that affect my eligibility?',
];

export default function ChatPanel({ transcriptData }) {
  const [messages, setMessages] = useState([]); // [{ role, content, latency_ms? }]
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef();
  const textareaRef = useRef();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setError('');

    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history excluding the message we just added
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await sendChat(q, transcriptData, history);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.answer, latency_ms: res.latency_ms },
      ]);
    } catch (err) {
      setError(err.message);
      // Remove the user message so they can retry
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasTranscript = transcriptData && transcriptData !== 'No transcript provided.';

  return (
    <div className="chat-panel">
      {/* Transcript indicator */}
      {hasTranscript && (
        <div className="transcript-badge">
          🔒 Anonymized transcript loaded
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <h3>CODO Eligibility Advisor</h3>
            <p>Ask about requirements, GPA, or paste your transcript summary.</p>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLACEHOLDER_PROMPTS.map(p => (
                <button
                  key={p}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, justifyContent: 'flex-start' }}
                  onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className={`msg-avatar ${msg.role}`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div>
                <div className={`msg-bubble`}>{msg.content}</div>
                {msg.latency_ms != null && (
                  <div className="msg-latency">{(msg.latency_ms / 1000).toFixed(2)}s</div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="message assistant">
            <div className="msg-avatar assistant">🤖</div>
            <div className="msg-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <div className="error-msg">⚠ {error}</div>}

      {/* Input bar */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask about CODO eligibility… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          title="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const API_BASE = 'http://localhost:8000';

export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Status check failed');
  return res.json(); // { db_ready: bool }
}

export async function ingestFiles(files) {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const res = await fetch(`${API_BASE}/ingest`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ingest failed' }));
    throw new Error(err.detail || 'Ingest failed');
  }
  return res.json(); // { message, files_saved }
}

export async function sendChat(question, transcriptData, history) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript_data: transcriptData,
      chat_history: history,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
    throw new Error(err.detail || 'Chat request failed');
  }
  return res.json(); // { answer, latency_ms }
}

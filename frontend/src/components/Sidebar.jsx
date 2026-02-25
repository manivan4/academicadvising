import { useEffect, useRef, useState } from 'react';
import { getStatus, ingestFiles } from '../api';

export default function Sidebar() {
  const [dbReady, setDbReady] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState(null); // { type: 'success'|'error', text }
  const inputRef = useRef();

  // Poll DB status every 5 s
  useEffect(() => {
    const check = () => getStatus().then(d => setDbReady(d.db_ready)).catch(() => setDbReady(false));
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setPendingFiles(files);
    e.target.value = '';
  };

  const handleIngest = async () => {
    if (!pendingFiles.length) return;
    setIngesting(true);
    setIngestMsg(null);
    try {
      const res = await ingestFiles(pendingFiles);
      setIngestMsg({ type: 'success', text: res.message });
      setPendingFiles([]);
      setDbReady(true);
    } catch (err) {
      setIngestMsg({ type: 'error', text: err.message });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
        <div className="sidebar-logo-text">
          CODO Advisor
          <span>Purdue CS</span>
        </div>
      </div>

      {/* DB Status */}
      <div className="sidebar-section">
        <p className="sidebar-label">Database</p>
        <div className="db-status">
          <div className={`db-dot ${dbReady === null ? '' : dbReady ? 'green' : 'red'}`} />
          <span>
            {dbReady === null
              ? 'Checking…'
              : dbReady
              ? 'Vector DB ready'
              : 'DB not found'}
          </span>
        </div>
      </div>

      {/* KB Upload */}
      <div className="sidebar-section">
        <p className="sidebar-label">Knowledge Base</p>
        <div
          className="upload-zone"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleFiles}
            style={{ display: 'none' }}
          />
          📂&ensp;{pendingFiles.length
            ? `${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} selected`
            : 'Click to upload PDF / TXT'}
        </div>

        {pendingFiles.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleIngest}
            disabled={ingesting}
          >
            {ingesting ? <><span className="spinner" /> Ingesting…</> : '⚡ Ingest Files'}
          </button>
        )}

        {ingestMsg && (
          <div className={`ingest-status ${ingestMsg.type}`}>
            {ingestMsg.type === 'success' ? '✓ ' : '✗ '}
            {ingestMsg.text}
          </div>
        )}
      </div>
    </aside>
  );
}

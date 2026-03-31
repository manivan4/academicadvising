import { useEffect, useRef, useState } from 'react';
import { getStatus, ingestFiles } from '../api';
import { processTranscriptFile } from '../pdfRedactor';

export default function Sidebar({ onTranscriptRedacted }) {
  const [dbReady, setDbReady] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState(null); // { type: 'success'|'error', text }
  
  const [transcriptName, setTranscriptName] = useState(null);
  const [transcriptProcessing, setTranscriptProcessing] = useState(false);
  const [transcriptError, setTranscriptError] = useState(null);

  const pendingFilesRef = useRef();
  const transcriptRef = useRef();

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

  const handleTranscriptFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setTranscriptError(null);
    setTranscriptName(file.name);
    setTranscriptProcessing(true);
    e.target.value = '';

    try {
      const result = await processTranscriptFile(file);
      onTranscriptRedacted(result.redactedText);
    } catch (err) {
      setTranscriptError(err.message || 'Failed to parse PDF.');
      setTranscriptName(null);
    } finally {
      setTranscriptProcessing(false);
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
          onClick={() => pendingFilesRef.current?.click()}
        >
          <input
            ref={pendingFilesRef}
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

      {/* Transcript Upload */}
      <div className="sidebar-section">
        <p className="sidebar-label">Your Transcript</p>
        <div
          className="upload-zone"
          onClick={() => transcriptRef.current?.click()}
          style={transcriptName && !transcriptError ? { borderColor: 'var(--green-500)', background: 'rgba(34, 197, 94, 0.05)' } : {}}
        >
          <input
            ref={transcriptRef}
            type="file"
            accept=".pdf"
            onChange={handleTranscriptFile}
            style={{ display: 'none' }}
          />
          {transcriptProcessing ? (
            <><span className="spinner" /> Anonymizing...</>
          ) : transcriptName && !transcriptError ? (
            `🔒 ${transcriptName}`
          ) : (
            '📄 Click to upload Transcript'
          )}
        </div>
        {transcriptError && <div className="error-msg" style={{fontSize: '11px', marginTop: '6px'}}>{transcriptError}</div>}
      </div>
    </aside>
  );
}

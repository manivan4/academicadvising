import { useCallback, useRef, useState } from 'react';

/* ── Load pdf.js from CDN once ── */
function getPdfjsLib() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/* ── PII Redaction ── */
function redactPII(text, fullName) {
  let count = 0;
  const replace = (str, regex) =>
    str.replace(regex, () => { count++; return '[REDACTED]'; });

  if (fullName) {
    const escaped = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = replace(text, new RegExp(escaped, 'gi'));
  }
  text = replace(text, /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  text = replace(text, /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g);
  return { redactedText: text, count };
}

/* ── Component ── */
export default function Anonymizer({ onRedactionComplete }) {
  const [fullName, setFullName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { text, pages, redactions, words }
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }
    setPdfFile(file);
    setError('');
    setResult(null);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRedact = async () => {
    setLoading(true);
    setError('');
    try {
      const lib = await getPdfjsLib();
      const buf = await pdfFile.arrayBuffer();
      const pdf = await lib.getDocument({ data: buf }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(it => it.str).join(' '));
      }
      const rawText = pages.join('\n\n');
      const { redactedText, count } = redactPII(rawText, fullName.trim());
      const words = redactedText.trim().split(/\s+/).length;
      const res = { text: redactedText, pages: pdf.numPages, redactions: count, words };
      setResult(res);
      onRedactionComplete?.(redactedText);
    } catch (err) {
      setError(`Failed to process PDF: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canRedact = pdfFile && fullName.trim() && !loading;

  return (
    <div className="anon-panel">
      <h2>Anonymize Your Transcript</h2>
      <p className="subtitle">
        Your name, email, and phone are removed locally — nothing leaves your browser.
      </p>

      {/* Full Name */}
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. Jane Marie Doe"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* PDF Drop Zone */}
      <div className="form-group">
        <label className="form-label">PDF Transcript</label>
        <div
          className={`pdf-drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className="pdf-drop-icon">📄</div>
          <p className="pdf-drop-text">
            <strong>Click to upload</strong> or drag &amp; drop<br />
            <span style={{ fontSize: '11px', opacity: 0.7 }}>PDF files only</span>
          </p>
          {pdfFile && <p className="pdf-filename">✓ {pdfFile.name}</p>}
        </div>
      </div>

      {/* Redact Button */}
      <button
        className="btn btn-primary"
        onClick={handleRedact}
        disabled={!canRedact}
      >
        {loading
          ? <><span className="spinner" /> Processing…</>
          : '🔒 Redact Transcript'}
      </button>

      {/* Error */}
      {error && <div className="error-msg">{error}</div>}

      {/* Stats */}
      {result && (
        <>
          <div className="stats-strip">
            <div className="stat-card">
              <div className="stat-value indigo">{result.pages}</div>
              <div className="stat-label">Pages</div>
            </div>
            <div className="stat-card">
              <div className="stat-value red">{result.redactions}</div>
              <div className="stat-label">Redactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value green">{result.words.toLocaleString()}</div>
              <div className="stat-label">Words</div>
            </div>
          </div>

          <div className="redacted-output">
            <div className="redacted-header">
              <span className="redacted-label">Redacted Text</span>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              className="output-textarea"
              readOnly
              rows={10}
              value={result.text}
            />
          </div>

          <div className="success-banner">
            ✓ Transcript ready — switch to the <strong>Chat</strong> tab to check eligibility.
          </div>
        </>
      )}
    </div>
  );
}

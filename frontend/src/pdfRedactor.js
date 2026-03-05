/* ── Load pdf.js from CDN once ── */
export function getPdfjsLib() {
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
export function redactPII(text) {
  let count = 0;
  const redactedItems = [];

  const replace = (str, regex, type) =>
    str.replace(regex, (match) => { 
      count++; 
      redactedItems.push({ type, match });
      return '[REDACTED]'; 
    });

  const nameMatch = text.match(/name\s+([\s\S]{1,100}?)\s+current/i);
  if (nameMatch && nameMatch[1]) {
    const extractedName = nameMatch[1].trim();
    if (extractedName) {
      const escaped = extractedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = replace(text, new RegExp(escaped, 'gi'), 'Name');
    }
  }

  text = replace(text, /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, 'Email');
  text = replace(text, /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g, 'Phone');

  // Log the exact redacted strings to the browser console for developer verification
  if (redactedItems.length > 0) {
    console.group('🔒 Transcript Redaction Report');
    console.log(`Total items redacted: ${count}`);
    console.table(redactedItems);
    console.groupEnd();
  }

  return { redactedText: text, count };
}

export async function processTranscriptFile(pdfFile) {
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
  const { redactedText, count } = redactPII(rawText);
  return { redactedText, pages: pdf.numPages, redactions: count };
}

import { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Anonymizer from './components/Anonymizer';
import ChatPanel from './components/ChatPanel';

const TABS = [
  { id: 'anonymize', label: '🔒 Anonymize' },
  { id: 'chat',      label: '💬 Chat' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('anonymize');
  const [transcriptData, setTranscriptData] = useState('No transcript provided.');

  const handleRedactionComplete = (text) => {
    setTranscriptData(text);
    // Auto-switch to chat after a short delay so user can see the success banner
    setTimeout(() => setActiveTab('chat'), 800);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        {/* Tab bar */}
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'anonymize' && (
            <Anonymizer onRedactionComplete={handleRedactionComplete} />
          )}
          {activeTab === 'chat' && (
            <ChatPanel transcriptData={transcriptData} />
          )}
        </div>
      </div>
    </div>
  );
}

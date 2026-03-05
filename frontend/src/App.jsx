import { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [transcriptData, setTranscriptData] = useState('No transcript provided.');

  return (
    <div className="layout">
      <Sidebar onTranscriptRedacted={setTranscriptData} />

      <div className="main">
        {/* Tab content */}
        <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ChatPanel transcriptData={transcriptData} />
        </div>
      </div>
    </div>
  );
}

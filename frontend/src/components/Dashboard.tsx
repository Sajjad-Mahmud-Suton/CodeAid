import { useState } from 'react';
import type { ChangeEvent } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const defaultCodes: Record<string, string> = {
  c: '// Write some C code here\n#include <stdio.h>\n\nint main() {\n  printf("Hello CodeAid!\\n");\n  return 0;\n}',
  cpp: '// Write some C++ code here\n#include <iostream>\n\nint main() {\n  std::cout << "Hello CodeAid!\\n";\n  return 0;\n}',
  python: '# Write some Python code here\nprint("Hello CodeAid!")'
};

const Dashboard = ({ token, username }: { token: string, username?: string }) => {
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState(defaultCodes['c']);
  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(defaultCodes[lang]);
  };

  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [feature, setFeature] = useState('general');
  const [runLoading, setRunLoading] = useState(false);
  const [runOutput, setRunOutput] = useState('');
  const [stats, setStats] = useState<{ runs: number, queries: number } | null>(null);
  const [showStats, setShowStats] = useState(false);

  const logActivity = async (actionType: string) => {
    try {
      if (username) {
        await addDoc(collection(db, "activities"), {
          username,
          actionType,
          timestamp: serverTimestamp()
        });
      }
    } catch (e: any) { 
      console.error("Firebase AddDoc Error:", e);
    }
  };

  const fetchStats = async () => {
    if (!username) {
      alert("Username is missing!");
      return;
    }
    try {
      const q = query(collection(db, "activities"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      let runs = 0;
      let queries = 0;
      querySnapshot.forEach((doc) => {
        if (doc.data().actionType === 'run_code') runs++;
        if (doc.data().actionType === 'ask_ai') queries++;
      });
      setStats({ runs, queries });
      setShowStats(true);
    } catch (e: any) { 
      console.error("Firebase GetDocs Error:", e);
      alert("Error fetching stats: " + e.message + "\n\n(If it says Missing or insufficient permissions, you need to update Firebase Firestore Rules to allow read/write.)");
      // Show it anyway with 0 so the modal opens
      setStats({ runs: 0, queries: 0 });
      setShowStats(true);
    }
  };

  const handleRunCode = async () => {
    setRunLoading(true);
    setRunOutput('');
    logActivity('run_code');
    try {
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: language,
          version: '*',
          files: [
            {
              content: code
            }
          ]
        })
      });
      const data = await res.json();
      if (data.run && data.run.output) {
        setRunOutput(data.run.output);
      } else if (data.message) {
        setRunOutput(data.message);
      } else {
        setRunOutput('No output or error occurred.');
      }
    } catch (error: any) {
      setRunOutput('Failed to execute code: ' + error.message);
    }
    setRunLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResponse('');
    logActivity('ask_ai');
    
    try {
      const payload: any = {};
      if (feature === 'general') {
        payload.question = question;
      } else if (feature === 'question-from-code') {
        payload.code = code;
        payload.question = question;
      } else if (feature === 'help-fix-code') {
        payload.buggyCode = code;
        payload.errorOrIntention = question;
      } else if (feature === 'explain-code') {
        payload.code = code;
      } else if (feature === 'help-write-code') {
        payload.task = question;
      }

      const res = await fetch(`http://localhost:5000/api/chat/${feature}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorDetails = 'Server error';
        try {
          const errData = await res.json();
          errorDetails = errData.details || errData.error || errorDetails;
        } catch (e) {}
        throw new Error(errorDetails);
      }

      // Handle non-streaming responses (JSON)
      if (feature === 'help-fix-code' || feature === 'explain-code') {
        const data = await res.json();
        setResponse(JSON.stringify(data, null, 2));
        setLoading(false);
        return;
      }

      // Handle streaming responses (SSE)
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const data = JSON.parse(dataStr);
                  if (data.error) {
                    setResponse(prev => prev + '\n\n**Error:** ' + data.error);
                  } else if (data.content) {
                    setResponse(prev => prev + data.content);
                  }
                } catch (e) {
                  // Ignore parsing errors for partial chunks
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      setResponse(error.message || 'Error connecting to assistant.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <div className="editor-section" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h3>Code Editor</h3>
            <select value={language} onChange={handleLanguageChange} style={{ padding: '4px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div>
            <button onClick={fetchStats} style={{ marginRight: '10px', padding: '5px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📊 My Progress
            </button>
            <button onClick={handleRunCode} disabled={runLoading} style={{ padding: '5px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {runLoading ? 'Running...' : '▶ Run Code'}
            </button>
          </div>
        </div>
        <div className="editor-wrapper" style={{ flex: 1, minHeight: '60%' }}>
          <Editor height="100%" language={language === 'cpp' ? 'cpp' : language} value={code} onChange={(v) => setCode(v || '')} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 14 }} />
        </div>
        <div className="output-section" style={{ height: '30%', backgroundColor: '#1e1e1e', color: '#fff', padding: '10px', overflowY: 'auto', borderTop: '2px solid #333' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' }}>Execution Output</h4>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', color: runOutput.toLowerCase().includes('error') ? '#f44336' : '#fff' }}>
            {runOutput || 'Code output will appear here...'}
          </pre>
          {(runOutput.toLowerCase().includes('error') || runOutput.toLowerCase().includes('failed')) && (
            <button onClick={() => {
              setFeature('help-fix-code');
              setQuestion('I got this error when running my code:\n' + runOutput + '\n\nHow do I fix it?');
            }} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              🤖 Explain this Error
            </button>
          )}
        </div>
      </div>
      
      <div className="assistant-section">
        <div className="section-header">
          <h3>CodeAid Assistant</h3>
        </div>
        
        <div className="assistant-controls">
          <div style={{ display: 'flex', gap: '10px' }}>
            <select value={feature} onChange={e => setFeature(e.target.value)} style={{ flex: 1 }}>
              <option value="general">General Question</option>
              <option value="question-from-code">Question from Code</option>
              <option value="help-fix-code">Help Fix Code</option>
              <option value="explain-code">Explain Code</option>
              <option value="help-write-code">Help Write Code</option>
            </select>
            <button onClick={handleSubmit} disabled={loading} style={{ width: '120px' }}>
              {loading ? 'Thinking...' : 'Submit'}
            </button>
          </div>
          <div>
            <textarea 
              rows={2}
              placeholder="Ask your question or describe your task..." 
              value={question} 
              onChange={e => setQuestion(e.target.value)}
            />
          </div>
        </div>
        
        <div className="assistant-output">
          {feature === 'help-fix-code' || feature === 'explain-code' ? (
             <div className="raw-json-output">{response}</div>
          ) : (
             <div className="markdown-body">
               <ReactMarkdown>{response}</ReactMarkdown>
             </div>
          )}
        </div>
      </div>

      {showStats && stats && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '10px', minWidth: '300px', color: 'white' }}>
            <h2 style={{ marginTop: 0, color: '#3498db' }}>Student Progress</h2>
            <hr style={{ borderColor: '#333' }} />
            <div style={{ margin: '20px 0', fontSize: '1.2em' }}>
              <p>💻 Codes Executed: <strong style={{ color: '#4caf50' }}>{stats.runs}</strong></p>
              <p>🤖 AI Consultations: <strong style={{ color: '#9b59b6' }}>{stats.queries}</strong></p>
            </div>
            <button onClick={() => setShowStats(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

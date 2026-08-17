import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';

const Dashboard = ({ token }: { token: string }) => {
  const [code, setCode] = useState('// Write some C code here\n#include <stdio.h>\n\nint main() {\n  printf("Hello CodeAid!\\n");\n  return 0;\n}');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [feature, setFeature] = useState('general');
  const [runLoading, setRunLoading] = useState(false);
  const [runOutput, setRunOutput] = useState('');

  const handleRunCode = async () => {
    setRunLoading(true);
    setRunOutput('');
    try {
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: 'c',
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
          <h3>Code Editor</h3>
          <button onClick={handleRunCode} disabled={runLoading} style={{ padding: '5px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {runLoading ? 'Running...' : '▶ Run Code'}
          </button>
        </div>
        <div className="editor-wrapper" style={{ flex: 1, minHeight: '60%' }}>
          <Editor height="100%" defaultLanguage="c" value={code} onChange={(v) => setCode(v || '')} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 14 }} />
        </div>
        <div className="output-section" style={{ height: '30%', backgroundColor: '#1e1e1e', color: '#fff', padding: '10px', overflowY: 'auto', borderTop: '2px solid #333' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' }}>Execution Output</h4>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', color: runOutput.toLowerCase().includes('error') ? '#f44336' : '#fff' }}>
            {runOutput || 'Code output will appear here...'}
          </pre>
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
    </div>
  );
};

export default Dashboard;

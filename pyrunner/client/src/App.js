import React, { useEffect, useState } from 'react';
import './App.css';
import MonacoEditorComponent from './components/Editor';

function App() {
  const [code, setCode] = useState('# Please start your code here');
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState([]);

  const executeCode = async () => {
    const response = await fetch('http://localhost:8000/run/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    if (result.error) {
      setOutput("Error: " + result.error);
    } else {
      setOutput(result.result);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/history/');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/clear-history/', { method: 'DELETE' });
      const data = await response.json();
      setHistory([]);
      alert(data.message);
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Failed to clear history: ' + error.message);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="App">
      <h1>Python Code Runner by Charles Zhang</h1>
      <div className="split-view">
        <div className="editor-pane">
          <MonacoEditorComponent
            language="python"
            theme="vs-dark"
            value={code}
            onChange={setCode}
          />
          <button onClick={executeCode} className="execute-button">Run Code</button>
          <button onClick={clearHistory} className="clear-button">Clear History</button>
        </div>
        <div className="output-pane">
          <h2>Output:</h2>
          <pre>{output}</pre>
          <h3>History</h3>
          {history.map((item, index) => (
            <div key={index}>
              <p><strong>Code:</strong></p>
              <pre>{item.code}</pre>
              <p><strong>Output:</strong></p>
              <pre>{item.output}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
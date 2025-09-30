// frontend/src/components/CodeEditor.jsx

import React, { useState } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react'; // <-- Monaco Editor

const API_BASE_URL = 'http://127.0.0.1:8000';

// List of supported languages for the dropdown
const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'java', name: 'Java' }, 
  { id: 'cpp', name: 'C++' },
];

// Helper to set initial boilerplate code
const getBoilerplate = (lang) => {
    switch(lang) {
        case 'python': return "# Python Code\nprint('Hello, EduVision!')";
        case 'javascript': return "// JavaScript Code\nconsole.log('Hello, EduVision!');";
        case 'java': return "// Java Code\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, EduVision!\");\n  }\n}";
        case 'cpp': return "// C++ Code\n#include <iostream>\nint main() {\n  std::cout << \"Hello, EduVision!\" << std::endl;\n  return 0;\n}";
        default: return '// Write your code here...';
    }
};

export default function CodeEditor() {
  const [language, setLanguage] = useState(SUPPORTED_LANGUAGES[0].id);
  const [code, setCode] = useState(getBoilerplate(SUPPORTED_LANGUAGES[0].id));
  const [output, setOutput] = useState('Execution output will appear here...');
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(getBoilerplate(newLang)); // Reset code to boilerplate
    setOutput('Execution output will appear here...');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Executing code...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOutput('Error: You must be logged in to run code.');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/run-code/`, 
        { code, language },
        { headers: { Authorization: `Token ${token}` } }
      );

      // Display the execution output (stdout/stderr)
      setOutput(`[${response.data.runtime_details}]\n\n${response.data.output}`);
      
    } catch (error) {
      // Handle 400 (sandbox error) or 503 (API connection error)
      const errorMessage = error.response?.data?.error || 'Execution failed due to an unknown server error.';
      setOutput(`Error: ${errorMessage}`);
      console.error("Code Execution Error:", error.response || error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
      <h3>🖥️ Real-time Code Editor</h3>
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>
          Language:
          <select 
            value={language} 
            onChange={handleLanguageChange}
            disabled={isRunning}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </label>
        <button onClick={handleRunCode} disabled={isRunning} style={{ padding: '8px 15px', backgroundColor: isRunning ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {isRunning ? 'Running...' : '▶ Run Code'}
        </button>
      </div>
      
      {/* MONACO EDITOR COMPONENT */}
      <div style={{ height: '300px', marginBottom: '10px', border: '1px solid #343a40' }}>
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={setCode}
          options={{
            readOnly: isRunning,
            minimap: { enabled: false }
          }}
        />
      </div>

      <h4>Output:</h4>
      <pre style={{ backgroundColor: '#333', color: '#00ff00', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', border: '1px solid #00ff00' }}>
        {output}
      </pre>
    </div>
  );
}
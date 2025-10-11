// frontend/src/components/CodeEditor.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const languageOptions = [
    { name: 'Python', value: 'python', judge0_id: 71 }, // Judge0 IDs are for simulation reference
    { name: 'JavaScript', value: 'javascript', judge0_id: 63 },
    { name: 'Java', value: 'java', judge0_id: 62 },
    { name: 'C++', value: 'cpp', judge0_id: 54 },
    { name: 'C', value: 'c', judge0_id: 50 },
    // SQL, HTML/CSS are typically run differently, but we'll include them for language selection
    { name: 'SQL', value: 'sql', judge0_id: 82 }, 
    { name: 'HTML', value: 'html', judge0_id: null },
];

const initialCode = {
    python: 'print("Hello, EduVision!")',
    javascript: 'console.log("Hello, EduVision!");',
    java: 'class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, EduVision!");\n  }\n}',
    // ... add initial code for other languages
    sql: 'SELECT * FROM users;', 
    c: '#include <stdio.h>\nint main() {\n  printf("Hello, EduVision!");\n  return 0;\n}',
    cpp: '#include <iostream>\nint main() {\n  std::cout << "Hello, EduVision!";\n  return 0;\n}'
};

export default function CodeEditor() {
    const [code, setCode] = useState(initialCode.python);
    const [output, setOutput] = useState('Run your code to see the output...');
    const [language, setLanguage] = useState(languageOptions[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    const handleLanguageChange = (e) => {
        const selectedLang = languageOptions.find(opt => opt.value === e.target.value);
        setLanguage(selectedLang);
        // Load initial code for the newly selected language if it exists
        setCode(initialCode[selectedLang.value] || ''); 
        setOutput('Language changed. Ready to run...');
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setOutput('Executing code...');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/code/execute/`,
                {
                    code: code,
                    language: language.value, // Send 'python', 'javascript', etc.
                    judge0_id: language.judge0_id // Optional: Judge0 ID for backend
                },
                {
                    headers: { Authorization: `Token ${token}` }
                }
            );
            
            // Display output from the backend (which simulates the Judge0/Docker response)
            setOutput(response.data.output || response.data.error || 'Execution completed.');

        } catch (error) {
            setOutput('Error executing code. Check connection or your code.');
            console.error("Execution error:", error.response || error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ margin: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Real-time Code Editor</h2>
            
            <div style={{ marginBottom: '10px' }}>
                <label>Language: </label>
                <select value={language.value} onChange={handleLanguageChange} disabled={isLoading}>
                    {languageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.name}</option>
                    ))}
                </select>
            </div>

            <Editor
                height="40vh"
                language={language.value}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                }}
            />

            <button 
                onClick={handleSubmit} 
                disabled={isLoading}
                style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
                {isLoading ? 'Running...' : 'Run Code'}
            </button>
            
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333', color: '#fff', borderRadius: '5px', minHeight: '100px' }}>
                <h3>Output:</h3>
                <pre>{output}</pre>
            </div>
        </div>
    );
}

// Don't forget to export it in index.js or similar for organization if needed, but the direct export works for now.
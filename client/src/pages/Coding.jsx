
import React, { useState } from 'react';

const LANGUAGES = [
  { id: 54, name: 'C++' },
  { id: 62, name: 'Java' },
  { id: 71, name: 'Python' },
  { id: 63, name: 'JavaScript' },
  { id: 50, name: 'C' },
  { id: 72, name: 'Ruby' },
  { id: 60, name: 'Go' },
  { id: 70, name: 'Python 2' },
  { id: 61, name: 'PHP' },
  { id: 73, name: 'Swift' },
  { id: 74, name: 'TypeScript' },
  { id: 78, name: 'Kotlin' },
  { id: 79, name: 'Scala' },
  { id: 80, name: 'Rust' },
];

const DEFAULT_CODE = {
  54: '#include <iostream>\nint main() { std::cout << "Hello, World!"; return 0; }',
  62: 'public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }',
  71: 'print("Hello, World!")',
  63: 'console.log("Hello, World!");',
  50: '#include <stdio.h>\nint main() { printf("Hello, World!\n"); return 0; }',
  72: 'puts "Hello, World!"',
  60: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello, World!") }',
  70: 'print "Hello, World!"',
  61: '<?php echo "Hello, World!"; ?>',
  73: 'print("Hello, World!")',
  74: 'console.log("Hello, World!");',
  78: 'fun main() { println("Hello, World!") }',
  79: 'object Main extends App { println("Hello, World!") }',
  80: 'fn main() { println!("Hello, World!"); }',
};

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
const JUDGE0_HEADERS = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': '654b61813emsh38a8731942d1baap14de32jsn69715406d247', // Replace with your RapidAPI key
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
};


function Coding() {
  const [language, setLanguage] = useState(71); // Default Python
  const [code, setCode] = useState(DEFAULT_CODE[71]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(() => {
    const saved = localStorage.getItem('codingSubmissionCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showInterestMsg, setShowInterestMsg] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch(JUDGE0_URL, {
        method: 'POST',
        headers: JUDGE0_HEADERS,
        body: JSON.stringify({
          source_code: code,
          language_id: language,
        }),
      });
      const data = await res.json();
      setOutput(data.stdout || data.stderr || data.compile_output || 'No output');
      // Track submissions locally
      setSubmissionCount(prev => {
        const next = prev + 1;
        localStorage.setItem('codingSubmissionCount', next);
        return next;
      });
    } catch (err) {
      setOutput('Error running code');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Max Solutions Coding Playground</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-semibold text-sm">Powered by Max Solutions</span>
      </div>
      {submissionCount >= 50 && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <h2 className="text-lg font-bold text-yellow-700 mb-2">Wow! Our coding playground is expanding 🚀</h2>
          <p className="text-yellow-800">You've reached over 50 code runs today. This feature is highly used and we're working to improve and expand it for you and all Max Solutions users!</p>
        </div>
      )}
  <div className="mb-4 flex gap-4 items-center">
        <label className="font-semibold">Language:</label>
        <select value={language} onChange={e => {
          setLanguage(Number(e.target.value));
          setCode(DEFAULT_CODE[Number(e.target.value)] || '');
        }} className="border rounded px-2 py-1">
          {LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
      </div>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        rows={12}
        className="w-full border rounded p-2 font-mono text-base mb-4 bg-gray-50 focus:bg-white focus:border-blue-400"
        spellCheck={false}
      />
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleRun}
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run Code'}
        </button>
        <button
          onClick={() => setShowInterestMsg(true)}
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-green-700 transition"
        >
          Interested in Biweekly & Intra-College Coding Challenges?
        </button>
      </div>
      {showInterestMsg && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded text-green-800 font-semibold">
          Thanks for showing interest! We are launching these challenges soon. Stay tuned!
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Output:</h2>
        <pre className="bg-gray-100 border rounded p-4 whitespace-pre-wrap min-h-[60px] text-base">{output}</pre>
      </div>
      <div className="mt-8 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} Max Solutions. All rights reserved.
      </div>
    </div>
  );
}

export default Coding;

// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import RunControls from './components/RunControls';
import { Flag } from "lucide-react";

interface ValidationResult {
  record_id: number | string;
  result: "Reprocess" | "Delete" | "Fix" | "Escalate" | "Undefined";
  llm_reasoning: string;

  // UI state
  marked?: boolean;
  reprocessed?: boolean;
  deleted?: boolean;
  fixed?: boolean;
  escalated?: boolean;
  undefined?: boolean;
}

function App() {
  const [records, setRecords] = useState<any[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [keySource, setKeySource] = useState<string>('');
  const [summary, setSummary] = useState<{
    reprocess: number;
    delete: number;
    fix: number;
    escalate: number;
    undefined: number;
  }>({
    reprocess: 0,
    delete: 0,
    fix: 0,
    escalate: 0,
    undefined: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');
  const [feedbackItemId, setFeedbackItemId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [advancedTemp, setAdvancedTemp] = useState<boolean>(false);
  const [lastRun, setLastRun] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          setFileError('The JSON must be an array of records.');
          return;
        }
        setFileError('');
        setRecords(json);
      } catch (err) {
        setFileError('Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const loadDemoFile = async () => {
    try {
      const response = await fetch('/test_data/demo_bdoc_1.json');
      const json = await response.json();
      if (!Array.isArray(json)) {
        setFileError('The demo file must be a JSON array.');
        return;
      }
      setFileError('');
      setRecords(json);
    } catch (err) {
      setFileError('Failed to load demo example.');
    }
  };

  const runValidation = async (useRag: boolean) => {
    setLoading(true);
    setIsValidating(true);
    try {
      const defaultTemperature = 0.7;
      const endpoint = `${import.meta.env.VITE_API_URL}/validate`;
      const response = await axios.post(endpoint, {
        records,
        use_rag: useRag,
        temperature: defaultTemperature,
        source: "react",
      });

      const resData = response.data;

      const resultsWithMarked = resData.results.map((r: any) => ({
        ...r,
        marked: false,
        accepted: false,
        rejected: false,
        retried: false,
        feedbackSent: false,
        emailed: false,
        worklisted: false,
      }));

      const reprocessCount = resultsWithMarked.filter(r => r.result === "Reprocess").length;
      const deleteCount = resultsWithMarked.filter(r => r.result === "Delete").length;
      const fixCount = resultsWithMarked.filter(r => r.result === "Fix").length;
      const escalateCount = resultsWithMarked.filter(r => r.result === "Escalate").length;
      const undefinedCount = resultsWithMarked.filter(r => r.result === "Undefined").length;

      setResults(resultsWithMarked);
      setSummary({
        reprocess: reprocessCount,
        delete: deleteCount,
        fix: fixCount,
        escalate: escalateCount,
        undefined: undefinedCount
      });
      setKeySource(resData.key_source || "API Unknown");

    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const toggleMarked = (recordId: number) => {
    setResults((prevResults) =>
      prevResults.map((r) =>
        r.record_id === recordId ? { ...r, marked: !r.marked } : r
      )
    );
  };

  const handleAccept = (recordId: number) => {
    setResults(prev =>
      prev.map(r =>
        r.record_id === recordId ? { ...r, accepted: !r.accepted } : r
      )
    );
  };

  const handleReject = (recordId: number) => {
    setResults(prev =>
      prev.map(r =>
        r.record_id === recordId ? { ...r, rejected: !r.rejected } : r
      )
    );
  };

  const handleRetry = async (recordId: number) => {
    const index = results.findIndex(r => r.record_id === recordId);
    const recordToRetry = records[index];
    if (!recordToRetry) return;

    setResults(prev =>
      prev.map(r =>
        r.record_id === recordId ? { ...r, retried: true } : r
      )
    );

    try {
      const endpoint = `${import.meta.env.VITE_API_URL}/validate`;
      const response = await axios.post(endpoint, {
        records: [recordToRetry],
        use_rag: false,
      });

      const retried = response.data.results[0];

      const updatedResults = results.map((r, idx) =>
        r.record_id === recordId
          ? {
              ...retried,
              accepted: r.accepted,
              rejected: r.rejected,
              marked: r.marked,
              retried: false,
            }
          : r
      );

      const okCount = updatedResults.filter(r => r.status === 'OK').length;
      const scored = updatedResults.filter(r => r.score !== null && r.score !== undefined);
      const avgScore = scored.length > 0
        ? (scored.reduce((sum, r) => sum + r.score!, 0) / scored.length).toFixed(1)
        : null;

      setResults(updatedResults);
      setSummary({
        reprocess: reprocessCount,
        delete: deleteCount,
        fix: fixCount,
        escalate: escalateCount,
        undefined: undefinedCount
      });
    } catch (err) {
      console.error('Retry failed:', err);
      setResults(prev =>
        prev.map(r =>
          r.record_id === recordId ? { ...r, retried: false } : r
        )
      );
    }
  };

  const handleFeedbackOpen = (recordId: number) => {
    setFeedbackItemId(recordId);
    setFeedbackText('');
  };

  const handleFeedbackClose = () => {
    setFeedbackItemId(null);
    setFeedbackText('');
  };

  const handleEmail = (recordId: number) => {
    const result = results.find(r => r.record_id === recordId);
    if (!result) return;

    const subject = `Validation Result for Item ${recordId + 1}`;
    const body = `Result: ${result.result}
Score: ${result.score}
Reasoning:
${result.llm_reasoning}`;

    const html = `
      <html>
        <head>
          <title>Compose Email</title>
          <style>
            body { font-family: sans-serif; padding: 1rem; }
            input, textarea { width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px; }
            label { font-weight: bold; margin-bottom: 4px; display: block; }
            textarea { height: 200px; resize: vertical; }
          </style>
        </head>
        <body>
          <h2>Send Email</h2>
          <label>To:</label>
          <input type="text" value="example@company.com" />
          <label>Cc:</label>
          <input type="text" value="" />
          <label>Subject:</label>
          <input type="text" value="${subject}" />
          <label>Body:</label>
          <textarea>${body}</textarea>
          <p style="margin-top: 1rem; font-style: italic; color: #666;">
            For demo purposes only. No message will be sent.
          </p>
        </body>
      </html>
    `;
    const newWindow = window.open('', '_blank', 'width=700,height=600');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  const handleWorklist = (recordId: number) => {
    setResults(prev =>
      prev.map(r =>
        r.record_id === recordId ? { ...r, worklisted: true } : r
      )
    );
  };

return (
  <>
    {/* new background so it looks different than Smart Validator */}
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-pink-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* a new hero header (different style + no old Header component) */}
        <Header />
        {/* main card */}
        <div className="mt-8 bg-white p-8 shadow-xl rounded-2xl border border-slate-100">
          <UploadSection
            handleFileChange={handleFileChange}
            loadDemoFile={loadDemoFile}
          />

          {fileError && <p className="text-red-500 mb-2">{fileError}</p>}

          <RunControls
            records={records}
            runValidation={runValidation}
            temperature={temperature}
            setTemperature={setTemperature}
            advancedTemp={advancedTemp}
            setAdvancedTemp={setAdvancedTemp}
            lastRun={lastRun}
            setLastRun={setLastRun}
            isValidating={isValidating}
          />

          {loading && (
            <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center text-gray-700">
              <ClipLoader size={36} color="#7c3aed" />
              <span className="mt-4 text-lg font-semibold">Validating...</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="mt-6">

              <div className="mb-4 space-y-1">
                <hr className="my-4 border-t border-gray-300" />
                <p className="font-semibold">Analysis:</p>

                {summary.reprocess > 0 && (
                  <p className="text-green-600 font-bold">🔁 {summary.reprocess} Reprocess</p>
                )}

                {summary.delete > 0 && (
                  <p className="text-red-600 font-bold">🗑️ {summary.delete} Delete</p>
                )}

                {summary.fix > 0 && (
                  <p className="text-blue-600 font-bold">🛠️ {summary.fix} Fix</p>
                )}

                {summary.escalate > 0 && (
                  <p className="text-orange-600 font-bold">⚠️ {summary.escalate} Escalate</p>
                )}

                {summary.undefined > 0 && (
                  <p className="text-gray-600 font-bold">❓ {summary.undefined} Undefined</p>
                )}
              </div>

              <hr className="mb-4" />

              {results.map((result, idx) => (
                <div key={idx} className="bg-white shadow-md rounded-xl p-4 my-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Item {idx + 1}:</h3>

                    <button
                      onClick={() => toggleMarked(result.record_id as number)}
                      className="transition transform hover:scale-110"
                      title={result.marked ? "Unmark" : "Mark for Review"}
                    >
                      <Flag
                        className="w-6 h-6"
                        stroke="red"
                        fill={result.marked ? "red" : "transparent"}
                      />
                    </button>

                  </div>

                  <div className="text-sm text-gray-600 mt-1 flex gap-4 items-center flex-wrap">
                    <span>
                      <span className="font-semibold">Result:</span>
                      {(() => {
                        const color =
                          result.result === 'Reprocess' ? 'text-green-600' :
                          result.result === 'Delete'    ? 'text-red-600'   :
                          result.result === 'Fix'       ? 'text-blue-600'  :
                          result.result === 'Escalate'  ? 'text-orange-600':
                                                          'text-gray-600'; // Undefined / fallback
                        return (
                          <span className={`ml-1 font-bold ${color}`}>
                            {result.result}
                          </span>
                        );
                      })()}
                    </span>
                  </div>

                  <p className="mt-2 text-gray-700">{result.llm_reasoning}</p>

                  <div className="flex justify-start items-center gap-2 text-sm text-gray-700 border-t pt-2 mt-4 border-gray-200">
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        disabled={result.rejected}
                        onClick={() => handleAccept(result.record_id)}
                        className={
                          `flex items-center gap-1 px-3 py-1 rounded-full shadow transition text-sm ` +
                          (result.accepted
                            ? 'bg-rose-200 text-rose-900 font-semibold'
                            : result.rejected
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-rose-600 text-white hover:bg-rose-700')
                        }
                      >
                        {result.accepted ? '🔁 Reprocessed' : '🔁 Reprocess'}
                      </button>
                      <button
                        disabled={!!result.accepted}
                        onClick={() => handleReject(result.record_id as number)}
                        className={`flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ${
                          result.rejected
                            ? 'bg-red-200 text-red-800 font-semibold'
                            : result.accepted
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 hover:bg-red-100 hover:shadow-md'
                        }`}
                      >
                        {result.rejected ? '🗑️ Deleted' : '🗑️ Delete'}
                      </button>

                      <button
                        disabled={result.accepted || result.rejected || result.retried}
                        onClick={() => handleRetry(result.record_id)}
                        className={
                          `flex items-center gap-1 px-3 py-1 rounded-full shadow transition text-sm ` +
                          ((result.accepted || result.rejected || result.retried)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700')
                        }
                      >
                        {result.retried ? '⏳ Executing…' : '↻ Retry'}
                      </button>

                      <button
                        onClick={() => handleFeedbackOpen(result.record_id as number)}
                        className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg shadow hover:bg-yellow-100 hover:shadow-md transition text-sm"
                      >
                        🛠️ Fix
                      </button>

                      <button
                        onClick={() => handleEmail(result.record_id as number)}
                        className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg shadow hover:bg-pink-100 hover:shadow-md transition text-sm"
                      >
                        ⚠️ Escalate
                      </button>

                      <button
                        disabled={!!result.worklisted}
                        onClick={() => handleWorklist(result.record_id as number)}
                        className={`flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ${
                          result.worklisted
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 hover:bg-gray-100 hover:shadow-md'
                        }`}
                      >
                        {result.worklisted ? '❓ Unclear' : '❓ Undefined'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {feedbackItemId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96">
            <h2 className="text-lg font-bold mb-4">
              Item {feedbackItemId + 1}: Your feedback will help improve future AI responses!
            </h2>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback here..."
              className="w-full border border-gray-300 rounded-md p-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleFeedbackClose}
                className="px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackClose}
                className="px-4 py-1 text-sm bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-md"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);

}

export default App;

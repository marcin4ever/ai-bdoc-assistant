// src/components/RunControls.tsx
type Props = {
  records: any[];
  runValidation: (useRag: boolean) => void;
  isValidating: boolean;
};

export default function RunControls({ records, runValidation, isValidating }: Props) {
  const disabled = records.length === 0 || isValidating;

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => runValidation(false)}
          disabled={disabled}
          className={
            "px-8 py-3 rounded-full text-white font-semibold transition " +
            (disabled
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-rose-600 hover:bg-rose-700 shadow-lg hover:shadow-rose-300/60")
          }
        >
          ▶︎ Run Analysis
        </button>

        <button
          onClick={() => runValidation(true)}
          disabled={disabled}
          className={
            "px-8 py-3 rounded-full font-semibold transition border-2 " +
            (disabled
              ? "border-slate-300 text-slate-400 cursor-not-allowed"
              : "border-rose-500 text-rose-600 hover:bg-rose-50 shadow")
          }
        >
          🧑‍💻 Run in Expert Mode
        </button>
      </div>

      {records.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">Upload a JSON array to enable the buttons.</p>
      )}
    </div>
  );
}

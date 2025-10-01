// src/components/Header.tsx
export default function Header() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-red-50 shadow-[0_15px_40px_-15px_rgba(244,63,94,0.35)]">
      <div className="px-6 py-12 md:px-10 text-center">
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-rose-100 text-rose-700">
          BDOC • Monitoring Assistant
        </span>

        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold text-rose-600 drop-shadow-[0_6px_12px_rgba(244,63,94,0.4)]">
          AI BDOC MONITORING ASSISTANT
        </h1>

        <p className="mt-3 text-slate-600">
          BDOC Error Processing | Records Analysis and Validation |  RAG with CRM - Middleware Monitoring
        </p>
      </div>
    </div>
  );
}

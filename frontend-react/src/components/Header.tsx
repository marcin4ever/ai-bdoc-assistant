// src/components/Header.tsx
export default function Header() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl h-72 md:h-80 bg-center bg-cover"
      style={{ backgroundImage: "url('/BDOC_back_1.jpg')" }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 px-6 py-12 md:px-10 text-center text-white">
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-white/20 rounded-full">
          BDOC • Monitoring Assistant
        </span>

        <h1 className="mt-6 text-4xl md:text-6xl font-extrabold drop-shadow-lg">
          AI BDOC MONITORING ASSISTANT
        </h1>

        <p className="mt-4 text-lg md:text-xl text-slate-100 drop-shadow">
          BDOC Error Processing | Records Analysis and Validation | RAG with CRM - Middleware Monitoring
        </p>
      </div>
    </div>
  );
}

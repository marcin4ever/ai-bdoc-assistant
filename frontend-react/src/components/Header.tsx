export default function Header() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-cover bg-center"
      style={{ backgroundImage: "url('/BDOC_back_2.png')" }}
    >
      <div className="px-6 py-12 md:px-10 text-center bg-white/70 backdrop-blur-sm rounded-3xl">
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-rose-600 uppercase rounded-full">
          BDOC • Monitoring Assistant
        </span>

        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold text-rose-600 drop-shadow">
          AI BDOC MONITORING ASSISTANT
        </h1>

        <p className="mt-3 text-slate-700">
          BDOC Error Processing | Records Analysis and Validation | RAG with CRM - Middleware Monitoring
        </p>
      </div>
    </div>
  );
}

export default function Card({ title, children, right, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-100/80 bg-white p-4 shadow-card-sm ${className}`}
    >
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? <h3 className="font-semibold text-slate-800">{title}</h3> : <span />}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

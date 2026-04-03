import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("MediTrack UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#f0f4f9] px-4 py-10 text-slate-800">
          <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-white p-6 shadow-lg">
            <h1 className="text-lg font-bold text-red-700">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              The app hit an error while rendering. Try refreshing the page. If it keeps happening, clear site data
              for this origin and sign in again.
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-800">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

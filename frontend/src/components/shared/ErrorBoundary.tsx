import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 p-8">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-sm font-medium text-zinc-300">Something went wrong</p>
          <p className="text-xs text-zinc-500 text-center max-w-sm">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs px-3 py-1.5 glass rounded-lg hover:bg-white/5 text-violet-400"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

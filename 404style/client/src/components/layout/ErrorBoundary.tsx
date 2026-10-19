import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Glitch } from '@/components/fx/Glitch';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Glitch className="font-mono text-6xl font-bold text-primary">500</Glitch>
          <h1 className="mt-4 text-2xl font-bold">Мы сломались. Стильно.</h1>
          <p className="mt-2 text-muted">Уже чиним. Обновите страницу — обычно помогает.</p>
          <button className="mt-6 h-11 rounded-full bg-accent px-6 font-semibold text-[#0a0a0f]" onClick={() => window.location.reload()}>Перезагрузить</button>
        </div>
      </div>
    );
  }
}

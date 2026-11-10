import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}
interface State {
  readonly failed: boolean;
}

/** Последний рубеж: ошибка рендера не должна приводить к белому экрану без объяснений. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Необработанная ошибка интерфейса', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="fatal">
        <h1>Что-то пошло не так</h1>
        <p>Ваши сохранённые данные не затронуты. Перезапустите приложение.</p>
        <button type="button" onClick={() => { window.location.reload(); }}>
          Перезагрузить
        </button>
      </div>
    );
  }
}

// Catches render errors so a crash shows "Нещо се обърка" instead of a blank page.
// Visual = the prototype's 500 EmptyState (AdminScreens.jsx). A new `resetKey` (the route) clears the error.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import i18n from "@/lib/i18n";

interface Props {
  resetKey?: unknown;
  children: ReactNode;
}

interface State {
  error: Error | null;
  resetKey: unknown;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px] rounded-lg border bg-card">
          <EmptyState
            icon={<CircleAlert />}
            tone="error"
            title={t("err.500.t")}
            actions={
              <Button variant="secondary" onClick={() => window.location.reload()}>
                <RefreshCw />
                {t("common.retry")}
              </Button>
            }
          >
            {t("err.500")}
          </EmptyState>
        </div>
      </div>
    );
  }
}

import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Algo deu errado
          </h1>
          <p className="text-gray-600 mb-6">
            Ocorreu um erro inesperado. Tente recarregar a pagina.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Pagina
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

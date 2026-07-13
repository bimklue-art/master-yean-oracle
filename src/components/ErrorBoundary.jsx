import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage:
        error?.message || "An unexpected error interrupted the oracle ritual.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MASTER YEAN ORACLE runtime error:", error, errorInfo);
  }

  restartApplication = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="oracle-error-screen" role="alert">
          <div className="oracle-error-halo" aria-hidden="true" />

          <section className="oracle-error-panel">
            <p className="oracle-error-brand">MASTER YEAN ORACLE</p>
            <h1>仪式暂止</h1>

            <div className="oracle-error-divider" />

            <p className="oracle-error-message">
              系统出现暂时异常，请重新开启仪式。
            </p>

            <button
              type="button"
              className="oracle-error-button"
              onClick={this.restartApplication}
            >
              重新启坛
            </button>

            {import.meta.env.DEV && (
              <details className="oracle-error-details">
                <summary>Developer details</summary>
                <code>{this.state.errorMessage}</code>
              </details>
            )}
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

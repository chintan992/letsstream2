import React from "react";

interface BootErrorProps {
  title: string;
  message: string;
  details?: string;
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#0b0b0f",
    color: "#f5f5f7",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "640px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "12px",
    padding: "28px",
    background: "rgba(255, 255, 255, 0.04)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
  },
  title: {
    margin: "0 0 12px",
    fontSize: "22px",
    lineHeight: 1.3,
    fontWeight: 700,
  },
  message: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "rgba(245, 245, 247, 0.82)",
  },
  details: {
    margin: "0 0 20px",
    padding: "12px 14px",
    overflowX: "auto" as const,
    borderRadius: "8px",
    background: "rgba(0, 0, 0, 0.45)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#ffb4a8",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: "13px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  footer: {
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    gap: "12px",
  },
  button: {
    appearance: "none" as const,
    border: "0",
    borderRadius: "8px",
    padding: "10px 16px",
    background: "#e50914",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  hint: {
    margin: "16px 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "rgba(245, 245, 247, 0.55)",
  },
};

export default function BootError({ title, message, details }: BootErrorProps) {
  return (
    <div style={styles.page}>
      <div role="alert" style={styles.card}>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.message}>{message}</p>
        {details ? <pre style={styles.details}>{details}</pre> : null}
        <div style={styles.footer}>
          <button
            type="button"
            style={styles.button}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
        <p style={styles.hint}>
          Deployment: {window.location.host}
          {window.location.pathname !== "/"
            ? ` (opened at ${window.location.pathname})`
            : ""}
        </p>
      </div>
    </div>
  );
}

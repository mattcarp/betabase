/**
 * Global Error Page - Server Component Version
 * This is intentionally NOT a client component to avoid prerender issues.
 * It provides a minimal fallback when the root layout fails.
 */
export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0, fontWeight: 300 }}>
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#888",
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          An unexpected error occurred. Please refresh the page.
        </p>
        <a
          href="/"
          style={{
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          Return Home
        </a>
      </body>
    </html>
  );
}

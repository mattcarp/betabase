/**
 * 404 Not Found Page
 * Simple server-rendered page that doesn't require client components
 */
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0f",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1  className="mac-heading"style={{ fontSize: "6rem", margin: 0, fontWeight: 200 }}>404</h1>
      <p style={{ fontSize: "1.25rem", color: "#888", marginTop: "1rem" }}>Page not found</p>
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
    </div>
  );
}

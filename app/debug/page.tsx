"use client";

export default function DebugPage() {
  return (
    <div style={{ padding: '20px', background: 'black', color: 'white' }}>
      <h1>Debug Info</h1>
      <p>NEXT_PUBLIC_BYPASS_AUTH: {process.env.NEXT_PUBLIC_BYPASS_AUTH}</p>
      <p>Type: {typeof process.env.NEXT_PUBLIC_BYPASS_AUTH}</p>
      <p>Is "true": {process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ? "YES" : "NO"}</p>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
    </div>
  );
}
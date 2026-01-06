"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SelfHealingDemoContent() {
  const searchParams = useSearchParams();
  const [variant, setVariant] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showDevTools, setShowDevTools] = useState(true);

  useEffect(() => {
    const v = searchParams.get("variant");
    if (v) setVariant(parseInt(v, 10));
    setShowControls(searchParams.get("showControls") === "true");
    if (searchParams.get("showDevTools") === "false") setShowDevTools(false);
  }, [searchParams]);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const getSelectorInfo = () => {
    switch (variant) {
      case 1: return { id: "submit-btn", testid: null, className: null, label: "Original Selector" };
      case 2: return { id: "submit-btn", testid: null, className: null, label: "Same ID, New Position" };
      case 3: return { id: "release-submit-button", testid: "submit-action", className: null, label: "Renamed Selector" };
      case 4: return { id: null, testid: null, className: "release-submit-btn", label: "No ID, Class Only" };
      case 5: return { id: null, testid: null, className: null, label: "aria-label Only" };
      default: return { id: "submit-btn", testid: null, className: null, label: "Original" };
    }
  };

  const selectorInfo = getSelectorInfo();
  const baseClasses = "px-8 py-4 text-white rounded-xl font-normal text-lg transition-all duration-200 shadow-lg";

  const renderButton = () => {
    switch (variant) {
      case 1:
        return <button id="submit-btn" className={`mac-button ${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800`} onClick={handleSubmit}>Submit Release</button>;
      case 2:
        return <div className="flex flex-col items-end w-full"><button id="submit-btn" className={`mac-button ${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700`} onClick={handleSubmit}>Submit Release</button></div>;
      case 3:
        return <button id="release-submit-button" data-testid="submit-action" className={`mac-button ${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700`} onClick={handleSubmit}>Submit Release</button>;
      case 4:
        return <div className="button-wrapper"><button data-action="submit" className={`mac-button release-submit-btn ${baseClasses} bg-gradient-to-r from-emerald-600 to-emerald-700`} onClick={handleSubmit}>Submit Release</button></div>;
      case 5:
        return <button aria-label="Submit Release" className={`mac-button flex items-center gap-3 ${baseClasses} bg-gradient-to-r from-primary-600 to-primary-700`} onClick={handleSubmit}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Confirm Release</button>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background text-white">
      {showControls && (
        <div className="fixed top-4 right-4 bg-card/95 backdrop-blur border border-border rounded-xl p-4 z-50">
          <div className="text-xs text-muted-foreground mb-3">Demo Controls</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => setVariant(v)} className={`mac-button w-10 h-10 rounded-lg text-sm font-normal ${variant === v ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>{v}</button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto pt-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-primary-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            </div>
            <div>
              <h1 className="mac-heading text-2xl font-normal">AOMA Release Portal</h1>
              <p className="text-sm text-muted-foreground">Digital Release Submission</p>
            </div>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-8">
            <h2 className="mac-heading text-lg font-normal mb-6">Release Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Artist</span>
                <span className="text-foreground">Luna Martinez</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Album</span>
                <span className="text-foreground">Midnight Sessions</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tracks</span>
                <span className="text-foreground">12</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Release Date</span>
                <span className="text-foreground">Jan 24, 2026</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-border/30 text-sm">
                <span className="text-muted-foreground">Territories</span>
                <span className="text-blue-400">Worldwide</span>
              </div>
            </div>
            <div className="pt-6 border-t border-border/50">{renderButton()}</div>
            {submitted && <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">Release submitted successfully!</div>}
          </div>
        </div>

        {showDevTools && (
          <div className="mt-6 bg-background border border-border rounded-xl overflow-hidden font-mono text-sm">
            <div className="bg-card px-4 py-2 border-b border-border flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Element Inspector</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded ${variant === 1 ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>{selectorInfo.label}</span>
            </div>
            <div className="p-4 text-muted-foreground">
              {selectorInfo.id && <div><span className="text-blue-400">id</span>=<span className="text-amber-400">"{selectorInfo.id}"</span></div>}
            </div>
            <div className="border-t border-border p-4 bg-card/50">
              <code className={`text-sm ${variant === 1 ? "text-green-400" : "text-red-400"}`}>page.click('#submit-btn')</code>
              {variant !== 1 && <div className="mt-2 text-xs text-red-400/80">Selector not found</div>}
            </div>
          </div>
        )}
        <div className="mt-6 mb-12 text-center text-muted-foreground text-xs">Variant {variant} of 5</div>
      </div>
    </div>
  );
}

export default function SelfHealingDemo() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <SelfHealingDemoContent />
    </Suspense>
  );
}

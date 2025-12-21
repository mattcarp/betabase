"use client";

/**
 * Self-Healing Demo Target App
 *
 * This is a realistic "app under test" that demonstrates self-healing tests.
 * The page simulates a SaaS checkout flow where a button's selector changes.
 *
 * THE SCENARIO:
 * - A developer refactors the checkout button
 * - The button ID changes from "#submit-btn" to "#order-submit-button"
 * - This is a common real-world scenario: renaming for clarity during refactoring
 * - The automated test breaks because it can't find the old selector
 * - Self-healing AI detects the button still exists (same text, role, position)
 * - AI updates the test automatically with 94% confidence
 *
 * URL Parameters:
 * - variant: 1 (original), 2 (moved), 3 (renamed), 4 (restructured), 5 (icon-only)
 * - showControls: true/false - show the variant switcher
 * - showDevTools: true/false - show the selector inspector overlay
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SelfHealingDemoPage() {
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

  // Get the current selector info for the dev tools overlay
  const getSelectorInfo = () => {
    switch (variant) {
      case 1:
        return { id: "submit-btn", testid: null, className: null, label: "Original Selector" };
      case 2:
        return { id: "submit-btn", testid: null, className: null, label: "Same ID, New Position" };
      case 3:
        return { id: "order-submit-button", testid: "submit-action", className: null, label: "Renamed Selector" };
      case 4:
        return { id: null, testid: null, className: "order-submit-btn", label: "No ID, Class Only" };
      case 5:
        return { id: null, testid: null, className: null, label: "aria-label Only" };
      default:
        return { id: "submit-btn", testid: null, className: null, label: "Original" };
    }
  };

  const selectorInfo = getSelectorInfo();

  // Different button variants to simulate UI changes
  const renderButton = () => {
    const baseClasses = "px-8 py-4 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg";

    switch (variant) {
      case 1:
        // Original: Simple button with id="submit-btn"
        return (
          <button
            id="submit-btn"
            className={`${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02]`}
            onClick={handleSubmit}
          >
            Complete Purchase
          </button>
        );

      case 2:
        // Moved: Button in different position, same id
        return (
          <div className="flex flex-col items-end w-full">
            <button
              id="submit-btn"
              className={`${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02]`}
              onClick={handleSubmit}
            >
              Complete Purchase
            </button>
          </div>
        );

      case 3:
        // Renamed: Different id, same text - THE MAIN DEMO SCENARIO
        return (
          <button
            id="order-submit-button"
            data-testid="submit-action"
            className={`${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02]`}
            onClick={handleSubmit}
          >
            Complete Purchase
          </button>
        );

      case 4:
        // Restructured: Wrapped in divs, different class, no id
        return (
          <div className="button-wrapper">
            <div className="button-container">
              <button
                data-action="submit"
                className={`order-submit-btn ${baseClasses} bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:scale-[1.02]`}
                onClick={handleSubmit}
              >
                Complete Purchase
              </button>
            </div>
          </div>
        );

      case 5:
        // Completely different: Icon button with aria-label
        return (
          <button
            aria-label="Complete Purchase"
            className={`flex items-center gap-3 ${baseClasses} bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-xl hover:scale-[1.02]`}
            onClick={handleSubmit}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirm Order
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Demo Controls - only shown when showControls=true */}
      {showControls && (
        <div className="fixed top-4 right-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 z-50 shadow-2xl">
          <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Demo Controls</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  variant === v
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-3 max-w-[200px]">
            {variant === 1 && "Original: id='submit-btn'"}
            {variant === 2 && "Moved: same id, different position"}
            {variant === 3 && "Renamed: id='order-submit-button'"}
            {variant === 4 && "Restructured: wrapped, no id"}
            {variant === 5 && "Icon button: aria-label only"}
          </div>
        </div>
      )}

      {/* Simulated SaaS App */}
      <div className="max-w-3xl mx-auto pt-12 px-6">
        {/* App Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">TechStore Pro</h1>
              <p className="text-sm text-slate-400">Secure Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            SSL Secured
          </div>
        </div>

        {/* Main Checkout Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          {/* Progress Bar */}
          <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                <span>Cart</span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-green-500"></div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                <span>Shipping</span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-green-500"></div>
              <div className="flex items-center gap-2 text-white">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Order Summary */}
            <h2 className="text-lg font-semibold text-white mb-6">Order Summary</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">MacBook Pro 14"</p>
                    <p className="text-sm text-slate-400">M3 Pro, 18GB RAM, 512GB SSD</p>
                  </div>
                </div>
                <span className="text-white font-semibold">$1,999.00</span>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">AppleCare+ Protection</p>
                    <p className="text-sm text-slate-400">3-year coverage</p>
                  </div>
                </div>
                <span className="text-white font-semibold">$299.00</span>
              </div>

              <div className="flex justify-between pt-4 text-lg">
                <span className="text-slate-300">Subtotal</span>
                <span className="text-white font-semibold">$2,298.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax (8.25%)</span>
                <span className="text-slate-300">$189.59</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-700/50 text-xl">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">$2,487.59</span>
              </div>
            </div>

            {/* The Button - THIS IS WHAT CHANGES */}
            <div className="pt-6 border-t border-slate-700/50">
              {renderButton()}
            </div>

            {/* Success Message */}
            {submitted && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Order submitted successfully! Confirmation email sent.
              </div>
            )}
          </div>
        </div>

        {/* Developer Tools Overlay - Shows the selector */}
        {showDevTools && (
          <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-sm">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-xs ml-2">Element Inspector</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                variant === 1 ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {selectorInfo.label}
              </span>
            </div>
            <div className="p-4 text-slate-300">
              <div className="flex items-start gap-3">
                <span className="text-purple-400">&lt;button</span>
                <div className="space-y-1">
                  {selectorInfo.id && (
                    <div>
                      <span className="text-blue-400">id</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-amber-400">"{selectorInfo.id}"</span>
                      {variant === 1 && <span className="ml-2 text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Test uses this!</span>}
                      {variant === 3 && <span className="ml-2 text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Changed!</span>}
                    </div>
                  )}
                  {selectorInfo.testid && (
                    <div>
                      <span className="text-blue-400">data-testid</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-amber-400">"{selectorInfo.testid}"</span>
                    </div>
                  )}
                  {selectorInfo.className && (
                    <div>
                      <span className="text-blue-400">class</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-amber-400">"{selectorInfo.className}"</span>
                    </div>
                  )}
                  {variant === 5 && (
                    <div>
                      <span className="text-blue-400">aria-label</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-amber-400">"Complete Purchase"</span>
                    </div>
                  )}
                </div>
                <span className="text-purple-400">&gt;</span>
              </div>
              <div className="ml-6 text-slate-400">Complete Purchase</div>
              <div><span className="text-purple-400">&lt;/button&gt;</span></div>
            </div>

            {/* What the test is looking for */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/50">
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Test Selector</div>
              <code className={`text-sm ${variant === 1 ? "text-green-400" : "text-red-400"}`}>
                page.click('#submit-btn')
              </code>
              {variant !== 1 && (
                <div className="mt-2 text-xs text-red-400/80">
                  Selector not found - element ID has changed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variant Info - smaller, at bottom */}
        <div className="mt-6 mb-12 text-center text-slate-500 text-xs">
          <p>Demo Variant {variant} of 5</p>
        </div>
      </div>
    </div>
  );
}

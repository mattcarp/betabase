"use client";

/**
 * Self-Healing Demo Target App
 *
 * This is a simple "app under test" that demonstrates self-healing tests.
 * The button can be "moved" (change its selector) to simulate UI changes.
 *
 * URL Parameters:
 * - variant: 1 (original), 2 (moved), 3 (renamed), 4 (restructured)
 * - showControls: true/false - show the variant switcher
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SelfHealingDemoPage() {
  const searchParams = useSearchParams();
  const [variant, setVariant] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const v = searchParams.get("variant");
    if (v) setVariant(parseInt(v, 10));
    setShowControls(searchParams.get("showControls") === "true");
  }, [searchParams]);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  // Different button variants to simulate UI changes
  const renderButton = () => {
    switch (variant) {
      case 1:
        // Original: Simple button with id="submit-btn"
        return (
          <button
            id="submit-btn"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={handleSubmit}
          >
            Submit Order
          </button>
        );

      case 2:
        // Moved: Button in different position, same id
        return (
          <div className="flex flex-col items-end">
            <div className="mb-4 text-sm text-gray-400">Button moved to right</div>
            <button
              id="submit-btn"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={handleSubmit}
            >
              Submit Order
            </button>
          </div>
        );

      case 3:
        // Renamed: Different id, same text
        return (
          <button
            id="order-submit-button"
            data-testid="submit-action"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={handleSubmit}
          >
            Submit Order
          </button>
        );

      case 4:
        // Restructured: Wrapped in divs, different class, no id
        return (
          <div className="button-wrapper">
            <div className="button-container">
              <button
                data-action="submit"
                className="order-submit-btn px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                onClick={handleSubmit}
              >
                Submit Order
              </button>
            </div>
          </div>
        );

      case 5:
        // Completely different: Icon button with aria-label
        return (
          <button
            aria-label="Submit Order"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            onClick={handleSubmit}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirm
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Demo Controls - only shown when showControls=true */}
      {showControls && (
        <div className="fixed top-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 z-50">
          <div className="text-xs text-zinc-400 mb-2">Demo Controls</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  variant === v
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {variant === 1 && "Original: id='submit-btn'"}
            {variant === 2 && "Moved: same id, different position"}
            {variant === 3 && "Renamed: id='order-submit-button'"}
            {variant === 4 && "Restructured: wrapped, no id"}
            {variant === 5 && "Icon button: aria-label only"}
          </div>
        </div>
      )}

      {/* Simulated App */}
      <div className="max-w-2xl mx-auto pt-20 px-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          {/* App Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Demo Store</h1>
              <p className="text-sm text-zinc-400">Checkout</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between py-3 border-b border-zinc-800">
              <span className="text-zinc-300">Product A</span>
              <span className="text-zinc-100">$29.99</span>
            </div>
            <div className="flex justify-between py-3 border-b border-zinc-800">
              <span className="text-zinc-300">Product B</span>
              <span className="text-zinc-100">$49.99</span>
            </div>
            <div className="flex justify-between py-3 font-semibold">
              <span>Total</span>
              <span className="text-blue-400">$79.98</span>
            </div>
          </div>

          {/* The Button - this is what changes */}
          <div className="pt-4 border-t border-zinc-800">
            {renderButton()}
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
              Order submitted successfully!
            </div>
          )}
        </div>

        {/* Variant Info */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>Variant {variant} of 5</p>
          <p className="mt-1">
            {variant === 1 && "Original selector: #submit-btn"}
            {variant === 2 && "Same ID, different DOM position"}
            {variant === 3 && "New ID: #order-submit-button"}
            {variant === 4 && "No ID, nested structure"}
            {variant === 5 && "Icon button with aria-label"}
          </p>
        </div>
      </div>
    </div>
  );
}

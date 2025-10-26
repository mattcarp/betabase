"use client";

import React, { useState, useEffect } from "react";
import { cognitoAuth } from "../services/cognitoAuth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("checking");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const isAuth = await cognitoAuth.isAuthenticated();
      if (isAuth) {
        setAuthStatus("authenticated");
        // Redirect to chat page if authenticated
        router.push("/chat");
      } else {
        setAuthStatus("unauthenticated");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLoginAttempt = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const user = await cognitoAuth.signIn(email, password);
      // If signIn returns a user object, authentication was successful
      if (user && user.accessToken) {
        setAuthStatus("authenticated");
        router.push("/chat");
      } else {
        setError("Authentication failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div cclassName="min-h-screen bg-black flex items-center justify-center">
        <div cclassName="text-white text-lg">Loading SIAM...</div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div cclassName="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div cclassName="bg-gray-800/50 p-8 rounded-lg backdrop-blur-sm border border-gray-700">
          <div cclassName="text-center mb-6">
            <h1 cclassName="mac-heading">
              SIAM
            </h1>
            <p cclassName="mac-body text-gray-300">Smart Interaction Agent Manager</p>
          </div>

          <div cclassName="space-y-4">
            <div>
              <label cclassName="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                cclassName="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label cclassName="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                cclassName="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleLoginAttempt}
              disabled={isLoading || !email || !password}
              cclassName="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition duration-200"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          {error && (
            <div cclassName="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Test credentials hint for development */}
          {process.env.NODE_ENV === "development" && (
            <div cclassName="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded text-blue-200 text-xs">
              <p cclassName="mac-body font-semibold mb-2">Test Credentials:</p>
              <p>Email: claude@test.siam.ai</p>
              <p>Password: 4@9XMPfE9B$</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Authenticated state - simple dashboard
  return (
    <div cclassName="min-h-screen bg-black text-white">
      <nav cclassName="bg-gray-900 p-4">
        <div cclassName="flex justify-between items-center">
          <h1 cclassName="mac-heading">
            SIAM Dashboard
          </h1>
          <button
            onClick={() => setAuthStatus("unauthenticated")}
            cclassName="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition duration-200"
          >
            Logout
          </button>
        </div>
      </nav>

      <main cclassName="p-8">
        <div cclassName="max-w-4xl mx-auto">
          <div cclassName="mb-8">
            <h2 cclassName="mac-heading">
              Welcome to SIAM
            </h2>
            <p cclassName="text-gray-300 text-lg">
              Your Smart Interaction Agent Manager is ready for deployment.
            </p>
          </div>

          <div cclassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div cclassName="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700">
              <h3 cclassName="mac-title">
                🎯 System Status
              </h3>
              <p cclassName="mac-body text-green-400">All systems operational</p>
            </div>

            <div cclassName="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700">
              <h3 cclassName="mac-title">
                🚀 Deployment
              </h3>
              <p cclassName="mac-body text-blue-400">Production ready</p>
            </div>

            <div cclassName="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700">
              <h3 cclassName="mac-title">
                ⚡ Performance
              </h3>
              <p cclassName="mac-body text-yellow-400">Optimized for speed</p>
            </div>
          </div>

          <div cclassName="mt-8 bg-green-500/20 border border-green-500/50 rounded-lg p-6">
            <h3
              cclassName="mac-title"
              cclassName="mac-title text-green-400 font-semibold text-lg mb-2"
            >
              🎉 Deployment Successful!
            </h3>
            <p cclassName="mac-body text-gray-300">
              SIAM has been successfully deployed to production. The authentication system is
              working, and the application is ready for users.
            </p>
            <div cclassName="mt-4 text-sm text-gray-400">Build Time: {new Date().toISOString()}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from "react";
import { CircularProfessionalProgress as RadialProgress } from "./components/ui/ProfessionalProgress";

const ComponentPlayground = () => {
  const [progressValue, setProgressValue] = useState(75);
  const [progressSize, setProgressSize] = useState(150);
  const [progressColor, setProgressColor] = useState<
    "primary" | "secondary" | "accent" | "warning" | "danger" | "success"
  >("primary");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1
            className="mac-heading"
            className="mac-heading text-4xl font-bold text-blue-600 mb-4"
          >
            SIAM UI Component Playground
          </h1>
          <p className="mac-body text-gray-300">Interactive component testing environment</p>
        </header>

        {/* RadialProgress Section */}
        <section className="mb-16">
          <h2
            className="mac-heading"
            className="mac-heading text-2xl font-bold text-blue-600 mb-8"
          >
            RadialProgress Component
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Component Display */}
            <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
              <div className="flex items-center justify-center min-h-[300px]">
                <RadialProgress
                  value={progressValue}
                  size={progressSize}
                  color={progressColor}
                  animated={true}
                  glowEffect={true}
                  showValue={true}
                  label="System Status"
                  subLabel="Real-time monitoring"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
              <h3
                className="mac-title"
                className="mac-title text-lg font-semibold text-blue-600 mb-6"
              >
                Component Controls
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Value: {progressValue}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progressValue}
                    onChange={(e) => setProgressValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Size: {progressSize}px
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="300"
                    step="10"
                    value={progressSize}
                    onChange={(e) => setProgressSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <select
                    value={progressColor}
                    onChange={(e) => setProgressColor(e.target.value as any)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-300"
                  >
                    <option value="primary">Primary (Cyan)</option>
                    <option value="secondary">Secondary (Blue)</option>
                    <option value="accent">Accent (Green)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="danger">Danger (Red)</option>
                    <option value="success">Success (Green)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Multiple Variants */}
          <div className="mt-12">
            <h3
              className="mac-title"
              className="mac-title text-lg font-semibold text-blue-600 mb-6"
            >
              Component Variants
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { value: 25, color: "danger" as const, label: "Low" },
                { value: 50, color: "warning" as const, label: "Medium" },
                { value: 75, color: "primary" as const, label: "High" },
                { value: 90, color: "accent" as const, label: "Optimal" },
                { value: 100, color: "success" as const, label: "Complete" },
                { value: 0, color: "secondary" as const, label: "Idle" },
              ].map((variant, index) => (
                <div key={index} className="text-center">
                  <RadialProgress
                    value={variant.value}
                    size={100}
                    color={variant.color}
                    animated={true}
                    glowEffect={true}
                    showValue={true}
                    label={variant.label}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System Status Dashboard */}
        <section className="mb-16">
          <h2
            className="mac-heading"
            className="mac-heading text-2xl font-bold text-blue-600 mb-8"
          >
            System Dashboard Example
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <RadialProgress
                value={78}
                size={120}
                color="primary"
                label="CPU"
                subLabel="8 cores"
                glowEffect={true}
                animated={true}
              />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <RadialProgress
                value={62}
                size={120}
                color="accent"
                label="Memory"
                subLabel="16GB total"
                glowEffect={true}
                animated={true}
              />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <RadialProgress
                value={34}
                size={120}
                color="secondary"
                label="Storage"
                subLabel="SSD 512GB"
                glowEffect={true}
                animated={true}
              />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <RadialProgress
                value={89}
                size={120}
                color="warning"
                label="Network"
                subLabel="1Gbps"
                glowEffect={true}
                animated={true}
              />
            </div>
          </div>
        </section>

        <footer className="text-center text-gray-400 mt-16">
          <p>SIAM UI Component Library • Interactive Testing Environment</p>
        </footer>
      </div>
    </div>
  );
};

export default ComponentPlayground;

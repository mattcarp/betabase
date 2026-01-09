import React, { useState, useEffect } from "react";
import { CircularProfessionalProgress as RadialProgress } from "./components/ui/ProfessionalProgress";
import { HUDMeter } from "./components/ui/HUDMeter";
import { DataStream } from "./components/ui/DataStream";
import { CircularHUD } from "./components/ui/CircularHUD";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function TestApp() {
  const [isRunning, setIsRunning] = useState(false);
  const [cpuValue, setCpuValue] = useState(45);
  const [memoryValue, setMemoryValue] = useState(65);
  const [dataHistory, setDataHistory] = useState<number[]>([]);
  const [networkSpeed, setNetworkSpeed] = useState(78);

  // Simulate real-time data updates
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        // Simulate realistic system metrics
        setCpuValue((prev) => Math.max(10, Math.min(95, prev + (Math.random() - 0.5) * 15)));
        setMemoryValue((prev) => Math.max(20, Math.min(90, prev + (Math.random() - 0.5) * 10)));
        setNetworkSpeed((prev) => Math.max(5, Math.min(100, prev + (Math.random() - 0.5) * 20)));

        // Add to data stream history
        setDataHistory((prev) => {
          const newValue = 30 + Math.sin(Date.now() / 1000) * 20 + Math.random() * 15;
          return [...prev, newValue].slice(-25); // Keep last 25 points
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Initialize with some data points
  useEffect(() => {
    const initialData = Array.from(
      { length: 10 },
      (_, i) => 40 + Math.sin(i * 0.5) * 15 + Math.random() * 10
    );
    setDataHistory(initialData);
  }, []);

  const resetValues = () => {
    setCpuValue(45);
    setMemoryValue(65);
    setNetworkSpeed(78);
    setDataHistory(
      Array.from({ length: 10 }, (_, i) => 40 + Math.sin(i * 0.5) * 15 + Math.random() * 10)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white font-mono p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 c className="mac-heading"lassName="mac-heading text-4xl font-normal text-holographic mb-2">
          JARVIS UI COMPONENT SHOWCASE
        </h1>
        <p className="text-jarvis-secondary text-lg">
          Testing RadialProgress, HUDMeter, DataStream &amp; CircularHUD Components
        </p>

        {/* Control Panel */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button className="mac-button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-6 py-4 rounded-lg font-normal transition-all ${
              isRunning
                ? "bg-jarvis-danger/20 border-2 border-jarvis-danger text-jarvis-danger hover:bg-jarvis-danger/30"
                : "bg-jarvis-primary/20 border-2 border-jarvis-primary text-jarvis-primary hover:bg-jarvis-primary/30"
            }`}
            data-testid="toggle-simulation"
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? "Stop Simulation" : "Start Simulation"}
          </button>

          <button
            onClick={resetValues}
            className="mac-button flex items-center gap-2 px-6 py-4 rounded-lg font-normal bg-jarvis-secondary/20 border-2 border-jarvis-secondary text-jarvis-secondary hover:bg-jarvis-secondary/30 transition-all"
            data-testid="reset-values"
          >
            <RotateCcw size={20} />
            Reset Values
          </button>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* RadialProgress Components */}
        <div className="glass-panel p-6 space-y-6">
          <h2 c className="mac-heading"lassName="mac-heading text-xl font-normal text-jarvis-accent border-b border-jarvis-primary/30 pb-2">
            RADIAL PROGRESS METERS
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <RadialProgress
                value={cpuValue}
                size={100}
                strokeWidth={8}
                color={cpuValue > 80 ? "danger" : cpuValue > 60 ? "warning" : "primary"}
                label="CPU"
                showValue={true}
                animated={true}
                glowEffect={true}
              />
              <span className="text-xs text-jarvis-secondary">CPU Usage</span>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <RadialProgress
                value={memoryValue}
                size={100}
                strokeWidth={8}
                color={memoryValue > 80 ? "danger" : memoryValue > 60 ? "warning" : "accent"}
                label="RAM"
                showValue={true}
                animated={true}
                glowEffect={true}
              />
              <span className="text-xs text-jarvis-secondary">Memory Usage</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex flex-col items-center space-y-2">
              <RadialProgress
                value={networkSpeed}
                size={120}
                strokeWidth={10}
                color="secondary"
                label="NET"
                showValue={true}
                animated={true}
                glowEffect={true}
              />
              <span className="text-xs text-jarvis-secondary">Network Speed</span>
            </div>
          </div>
        </div>

        {/* HUDMeter Components */}
        <div className="glass-panel p-6 space-y-6">
          <h2 c className="mac-heading"lassName="mac-heading text-xl font-normal text-jarvis-accent border-b border-jarvis-primary/30 pb-2">
            HUD ARC METERS
          </h2>

          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <HUDMeter
                value={cpuValue}
                size={140}
                thickness={8}
                startAngle={-120}
                endAngle={120}
                color={cpuValue > 80 ? "danger" : cpuValue > 60 ? "warning" : "primary"}
                label="CPU Load"
                unit="%"
                criticalThreshold={85}
                warningThreshold={70}
                showTicks={true}
                glowEffect={true}
              />
            </div>

            <div className="flex flex-col items-center">
              <HUDMeter
                value={memoryValue}
                size={140}
                thickness={8}
                startAngle={-90}
                endAngle={90}
                color={memoryValue > 80 ? "danger" : memoryValue > 60 ? "warning" : "accent"}
                label="Memory"
                unit="%"
                criticalThreshold={85}
                warningThreshold={70}
                showTicks={true}
                glowEffect={true}
              />
            </div>
          </div>
        </div>

        {/* DataStream Components */}
        <div className="glass-panel p-6 space-y-6">
          <h2 c className="mac-heading"lassName="mac-heading text-xl font-normal text-jarvis-accent border-b border-jarvis-primary/30 pb-2">
            REAL-TIME DATA STREAMS
          </h2>

          <div className="space-y-4">
            <DataStream
              data={dataHistory}
              height={80}
              width={280}
              color="primary"
              label="System Performance"
              animated={true}
              showGrid={true}
              showLabels={true}
              glowEffect={true}
              maxDataPoints={25}
            />

            <DataStream
              data={dataHistory.map((v) => v * 1.2 + Math.random() * 5)}
              height={80}
              width={280}
              color="accent"
              label="Network Throughput"
              animated={true}
              showGrid={true}
              showLabels={true}
              glowEffect={true}
              maxDataPoints={25}
            />

            <DataStream
              data={dataHistory.map((v) => Math.abs(Math.sin(v / 10)) * 80 + 10)}
              height={80}
              width={280}
              color="warning"
              label="Response Times"
              animated={true}
              showGrid={true}
              showLabels={true}
              glowEffect={true}
              maxDataPoints={25}
            />
          </div>
        </div>

        {/* Central HUD Demo */}
        <div className="lg:col-span-2 xl:col-span-3">
          <div className="glass-panel p-6 space-y-6">
            <h2 c className="mac-heading"lassName="mac-heading text-xl font-normal text-jarvis-accent border-b border-jarvis-primary/30 pb-2 text-center">
              CENTRAL CIRCULAR HUD INTERFACE
            </h2>

            <div className="flex justify-center py-8">
              <CircularHUD size={350} isActive={isRunning}>
                <div className="text-center space-y-3">
                  <div className="text-2xl font-normal text-holographic">
                    {isRunning ? "SYSTEM ACTIVE" : "SYSTEM IDLE"}
                  </div>
                  <div className="text-jarvis-secondary">
                    CPU: <span className="text-jarvis-primary">{cpuValue.toFixed(1)}%</span>
                  </div>
                  <div className="text-jarvis-secondary">
                    Memory: <span className="text-jarvis-accent">{memoryValue.toFixed(1)}%</span>
                  </div>
                  <div className="text-jarvis-secondary">
                    Network: <span className="text-jarvis-warning">{networkSpeed.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-jarvis-secondary/70 mt-4">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </CircularHUD>
            </div>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="text-center mt-8 text-jarvis-secondary text-sm">
        <p>
          All components feature: Jarvis theming • Smooth animations • Glow effects • Real-time
          updates
        </p>
        <p className="mac-body mt-2">
          Status:{" "}
          <span className={isRunning ? "text-jarvis-accent" : "text-jarvis-warning"}>
            {isRunning ? "SIMULATION RUNNING" : "SIMULATION STOPPED"}
          </span>
        </p>
      </div>
    </div>
  );
}

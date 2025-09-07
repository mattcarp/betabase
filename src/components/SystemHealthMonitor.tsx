import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { HUDMeter } from "./ui/HUDMeter";
import { CircularProfessionalProgress as RadialProgress } from "./ui/ProfessionalProgress"
import { DataStream } from "./ui/DataStream";

interface SystemHealth {
  cpu: number;
  memory: number;
  diskSpace: number;
  networkStatus: "online" | "offline" | "slow";
  lastUpdate: Date;
}

interface SystemHealthMonitorProps {
  onHealthChange?: (health: SystemHealth) => void;
  className?: string;
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  onHealthChange,
  className = "",
}) => {
  const [health, setHealth] = useState<SystemHealth>({
    cpu: 0,
    memory: 0,
    diskSpace: 0,
    networkStatus: "online",
    lastUpdate: new Date(),
  });

  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const updateHealth = useCallback(async () => {
    try {
      setHealth((prevHealth) => {
        // Simulate realistic system monitoring with some variation
        const newHealth: SystemHealth = {
          cpu: Math.max(
            10,
            Math.min(95, prevHealth.cpu + (Math.random() - 0.5) * 10),
          ),
          memory: Math.max(
            15,
            Math.min(90, prevHealth.memory + (Math.random() - 0.5) * 8),
          ),
          diskSpace: Math.max(
            30,
            Math.min(85, prevHealth.diskSpace + (Math.random() - 0.5) * 5),
          ),
          networkStatus: navigator.onLine ? "online" : "offline",
          lastUpdate: new Date(),
        };

        // Update history for data streams (keep last 20 points)
        setCpuHistory((prev) => [...prev, newHealth.cpu].slice(-20));
        setMemoryHistory((prev) => [...prev, newHealth.memory].slice(-20));

        onHealthChange?.(newHealth);
        return newHealth;
      });
    } catch (error) {
      console.error("Failed to update system health:", error);
    }
  }, [onHealthChange]);

  useEffect(() => {
    // Initial health check with some starting values
    const initialHealth: SystemHealth = {
      cpu: 25 + Math.random() * 30,
      memory: 40 + Math.random() * 25,
      diskSpace: 50 + Math.random() * 20,
      networkStatus: navigator.onLine ? "online" : "offline",
      lastUpdate: new Date(),
    };
    setHealth(initialHealth);
    setCpuHistory([initialHealth.cpu]);
    setMemoryHistory([initialHealth.memory]);

    // Set up periodic health monitoring
    const interval = setInterval(updateHealth, 2000); // Every 2 seconds

    // Listen for network status changes
    const handleOnline = () => updateHealth();
    const handleOffline = () => updateHealth();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateHealth]);

  const getNetworkIcon = () => {
    switch (health.networkStatus) {
      case "online":
        return <Wifi className="w-4 h-4 text-jarvis-accent" />;
      case "slow":
        return <Wifi className="w-4 h-4 text-jarvis-warning" />;
      case "offline":
        return <WifiOff className="w-4 h-4 text-jarvis-danger" />;
      default:
        return <Wifi className="w-4 h-4 text-jarvis-secondary" />;
    }
  };

  const getOverallStatus = () => {
    const maxUsage = Math.max(health.cpu, health.memory);
    if (health.networkStatus === "offline") return "critical";
    if (maxUsage > 90) return "critical";
    if (maxUsage > 70) return "warning";
    return "healthy";
  };

  const overallStatus = getOverallStatus();

  return (
    <div
      className={`glass-panel p-4 font-mono text-xs space-y-4 ${className}`}
      data-testid="system-health-monitor"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-jarvis-primary/10 rounded p-2 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="health-toggle"
      >
        <div className="flex items-center space-x-3">
          {overallStatus === "healthy" && (
            <CheckCircle className="w-5 h-5 text-jarvis-accent" />
          )}
          {overallStatus === "warning" && (
            <AlertTriangle className="w-5 h-5 text-jarvis-warning" />
          )}
          {overallStatus === "critical" && (
            <AlertTriangle className="w-5 h-5 text-jarvis-danger" />
          )}
          <span className="text-holographic font-display text-sm">
            SYSTEM STATUS:{" "}
            <span
              className={
                overallStatus === "healthy"
                  ? "text-jarvis-accent"
                  : overallStatus === "warning"
                    ? "text-jarvis-warning"
                    : "text-jarvis-danger"
              }
            >
              {overallStatus.toUpperCase()}
            </span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {getNetworkIcon()}
          <Activity className="w-4 h-4 text-jarvis-primary animate-pulse" />
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6" data-testid="health-details">
          {/* Circular Meters Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <RadialProgress
                value={health.cpu}
                size={80}
                strokeWidth={6}
                color={
                  health.cpu > 80
                    ? "danger"
                    : health.cpu > 60
                      ? "warning"
                      : "primary"
                }
                label="CPU"
                showValue={true}
                animated={true}
                glowEffect={true}
              />
            </div>

            <div className="flex flex-col items-center space-y-2">
              <RadialProgress
                value={health.memory}
                size={80}
                strokeWidth={6}
                color={
                  health.memory > 80
                    ? "danger"
                    : health.memory > 60
                      ? "warning"
                      : "accent"
                }
                label="RAM"
                showValue={true}
                animated={true}
                glowEffect={true}
              />
            </div>

            <div className="flex flex-col items-center space-y-2">
              <RadialProgress
                value={health.diskSpace}
                size={80}
                strokeWidth={6}
                color={
                  health.diskSpace > 80
                    ? "danger"
                    : health.diskSpace > 60
                      ? "warning"
                      : "secondary"
                }
                label="DISK"
                showValue={true}
                animated={true}
                glowEffect={true}
              />
            </div>
          </div>

          {/* HUD Meters Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <HUDMeter
                value={health.cpu}
                size={100}
                thickness={6}
                startAngle={-90}
                endAngle={90}
                color={
                  health.cpu > 80
                    ? "danger"
                    : health.cpu > 60
                      ? "warning"
                      : "primary"
                }
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
                value={health.memory}
                size={100}
                thickness={6}
                startAngle={-90}
                endAngle={90}
                color={
                  health.memory > 80
                    ? "danger"
                    : health.memory > 60
                      ? "warning"
                      : "accent"
                }
                label="Memory"
                unit="%"
                criticalThreshold={85}
                warningThreshold={70}
                showTicks={true}
                glowEffect={true}
              />
            </div>
          </div>

          {/* Data Streams */}
          <div className="space-y-4">
            <DataStream
              data={cpuHistory}
              height={60}
              width={320}
              color="primary"
              label="CPU Usage Over Time"
              animated={true}
              showGrid={true}
              showLabels={true}
              glowEffect={true}
              maxDataPoints={20}
            />

            <DataStream
              data={memoryHistory}
              height={60}
              width={320}
              color="accent"
              label="Memory Usage Over Time"
              animated={true}
              showGrid={true}
              showLabels={true}
              glowEffect={true}
              maxDataPoints={20}
            />
          </div>

          {/* Network Status */}
          <div className="flex items-center justify-between glass-panel p-3 border border-jarvis-primary/20">
            <div className="flex items-center space-x-3">
              {getNetworkIcon()}
              <span className="text-holographic">Network Status:</span>
            </div>
            <span
              className={
                health.networkStatus === "online"
                  ? "text-jarvis-accent font-bold"
                  : health.networkStatus === "slow"
                    ? "text-jarvis-warning font-bold"
                    : "text-jarvis-danger font-bold"
              }
            >
              {health.networkStatus.toUpperCase()}
            </span>
          </div>

          {/* Last Update */}
          <div className="text-jarvis-secondary text-xs text-center pt-2 border-t border-jarvis-primary/20 font-mono">
            Last update: {health.lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;

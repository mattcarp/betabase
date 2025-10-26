"use client";

import React, { useState } from "react";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { Annotation, FlagAnnotation, SeverityLevel } from "../../types/annotations";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Flag, X, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface FlagIssueLayerProps {
  enabled: boolean;
  timestamp: number;
  cclassName?: string;
}

interface FlagMarkerProps {
  annotation: Annotation;
  onDelete: (id: string) => void;
}

const SEVERITY_CONFIG = {
  low: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    label: "Low",
  },
  medium: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/50",
    label: "Medium",
  },
  high: {
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/50",
    label: "High",
  },
  critical: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/50",
    label: "Critical",
  },
};

const FlagMarker: React.FC<FlagMarkerProps> = ({ annotation, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const flagData = annotation.data as FlagAnnotation;
  const severityConfig = SEVERITY_CONFIG[flagData.severity];

  return (
    <div
      cclassName="absolute z-50"
      style={{
        left: `${flagData.position.x}px`,
        top: `${flagData.position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {/* Flag Icon */}
      <button
        cclassName={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-full",
          "border-2 transition-all hover:scale-110",
          severityConfig.bgColor,
          severityConfig.borderColor,
          "shadow-lg cursor-pointer"
        )}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Flag cclassName={cn("h-4 w-4", severityConfig.color)} />
      </button>

      {/* Details Popup */}
      {showDetails && (
        <Card
          cclassName={cn(
            "mac-card",
            "absolute top-full left-1/2 -translate-x-1/2 mt-2",
            "min-w-[300px] shadow-xl z-50"
          )}
        >
          <CardHeader cclassName="mac-card pb-4">
            <div cclassName="flex items-start justify-between">
              <div cclassName="flex items-center gap-2">
                <AlertTriangle cclassName={cn("h-4 w-4", severityConfig.color)} />
                <CardTitle cclassName="text-sm">{flagData.title}</CardTitle>
              </div>
              <div cclassName="flex items-center gap-2">
                <Badge
                  variant="outline"
                  cclassName={cn(severityConfig.borderColor, severityConfig.color)}
                >
                  {severityConfig.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  cclassName="h-6 w-6 mac-button mac-button-outline"
                  onClick={() => onDelete(annotation.id)}
                >
                  <X cclassName="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent cclassName="pt-0">
            <p cclassName="text-sm text-muted-foreground whitespace-pre-wrap">
              {flagData.description}
            </p>
            <div cclassName="mt-2 text-xs text-muted-foreground">
              {new Date(annotation.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const FlagIssueLayer: React.FC<FlagIssueLayerProps> = ({
  enabled,
  timestamp,
  cclassName,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [severity, setSeverity] = useState<SeverityLevel>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { annotations, addAnnotation, deleteAnnotation } = useAnnotations();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;

    setFormPosition({
      x: e.clientX,
      y: e.clientY,
    });
    setShowForm(true);
    setTitle("");
    setDescription("");
    setSeverity("medium");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const annotation: Annotation = {
      id: `flag-${Date.now()}`,
      timestamp,
      pageState: {
        url: window.location.href,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY,
        },
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      createdAt: new Date(),
      data: {
        type: "flag",
        position: formPosition,
        severity,
        title,
        description,
      },
    };

    addAnnotation(annotation);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const flagAnnotations = annotations.filter((ann) => ann.data.type === "flag");

  return (
    <>
      {/* Click layer for placing flags */}
      {enabled && !showForm && (
        <div
          cclassName={cn("fixed inset-0 z-40 cursor-crosshair", cclassName)}
          onClick={handleClick}
        />
      )}

      {/* Flag markers */}
      <div cclassName="fixed inset-0 z-50 pointer-events-none">
        <div cclassName="relative w-full h-full">
          {flagAnnotations.map((annotation) => (
            <div key={annotation.id} cclassName="pointer-events-auto">
              <FlagMarker annotation={annotation} onDelete={deleteAnnotation} />
            </div>
          ))}
        </div>
      </div>

      {/* Flag creation form */}
      {showForm && (
        <div cclassName="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <Card cclassName="mac-card max-w-md w-full">
            <CardHeader cclassName="mac-card">
              <CardTitle cclassName="flex items-center gap-2">
                <Flag cclassName="h-5 w-5" />
                Flag Issue
              </CardTitle>
            </CardHeader>
            <CardContent cclassName="space-y-4">
              {/* Severity Selection */}
              <div cclassName="space-y-2">
                <label cclassName="text-sm font-medium">Severity Level</label>
                <div cclassName="grid grid-cols-4 gap-2">
                  {(Object.keys(SEVERITY_CONFIG) as SeverityLevel[]).map((level) => {
                    const config = SEVERITY_CONFIG[level];
                    return (
                      <Button
                        key={level}
                        variant={severity === level ? "default" : "outline"}
                        size="sm"
                        cclassName={cn(
                          "mac-button mac-button-primary",
                          severity === level && config.bgColor,
                          severity === level && config.borderColor
                        )}
                        onClick={() => setSeverity(level)}
                      >
                        <span cclassName={severity === level ? config.color : ""}>
                          {config.label}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div cclassName="space-y-2">
                <label cclassName="text-sm font-medium">Title</label>
                <Input
                  cclassName="mac-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief issue description"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div cclassName="space-y-2">
                <label cclassName="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed explanation of the issue..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div cclassName="flex items-center justify-end gap-2">
                <Button
                  cclassName="mac-button mac-button-outline"
                  variant="outline"
                  cclassName="mac-button mac-button-outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  cclassName="mac-button mac-button-primary"
                  variant="default"
                  cclassName="mac-button mac-button-primary"
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                >
                  Flag Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

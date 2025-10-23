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
  className?: string;
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
      className="absolute z-50"
      style={{
        left: `${flagData.position.x}px`,
        top: `${flagData.position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {/* Flag Icon */}
      <button
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-full",
          "border-2 transition-all hover:scale-110",
          severityConfig.bgColor,
          severityConfig.borderColor,
          "shadow-lg cursor-pointer"
        )}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Flag className={cn("h-4 w-4", severityConfig.color)} />
      </button>

      {/* Details Popup */}
      {showDetails && (
        <Card
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2",
            "min-w-[300px] shadow-xl z-50"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("h-4 w-4", severityConfig.color)} />
                <CardTitle className="text-sm">{flagData.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(severityConfig.borderColor, severityConfig.color)}
                >
                  {severityConfig.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDelete(annotation.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {flagData.description}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
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
  className,
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
          className={cn("fixed inset-0 z-40 cursor-crosshair", className)}
          onClick={handleClick}
        />
      )}

      {/* Flag markers */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="relative w-full h-full">
          {flagAnnotations.map((annotation) => (
            <div key={annotation.id} className="pointer-events-auto">
              <FlagMarker annotation={annotation} onDelete={deleteAnnotation} />
            </div>
          ))}
        </div>
      </div>

      {/* Flag creation form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Flag Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Severity Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(SEVERITY_CONFIG) as SeverityLevel[]).map((level) => {
                    const config = SEVERITY_CONFIG[level];
                    return (
                      <Button
                        key={level}
                        variant={severity === level ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          severity === level && config.bgColor,
                          severity === level && config.borderColor
                        )}
                        onClick={() => setSeverity(level)}
                      >
                        <span className={severity === level ? config.color : ""}>
                          {config.label}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief issue description"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed explanation of the issue..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleSubmit} disabled={!title.trim()}>
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

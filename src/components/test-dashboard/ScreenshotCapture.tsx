"use client";

import React, { useState, useRef } from "react";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { Annotation, Position } from "../../types/annotations";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Download, X, Check, Crop } from "lucide-react";
import { cn } from "../../lib/utils";

interface ScreenshotCaptureProps {
  enabled: boolean;
  timestamp: number;
  cclassName?: string;
}

interface CropArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const ScreenshotCapture: React.FC<ScreenshotCaptureProps> = ({
  enabled,
  timestamp,
  cclassName,
}) => {
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { addAnnotation } = useAnnotations();

  const handleStartCrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;

    setIsCropping(true);
    setCropArea({
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    });
  };

  const handleMoveCrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropArea) return;

    setCropArea({
      ...cropArea,
      endX: e.clientX,
      endY: e.clientY,
    });
  };

  const handleEndCrop = async () => {
    if (!isCropping) return;

    setIsCropping(false);

    if (cropArea) {
      await captureScreenshot(cropArea);
    }
  };

  const captureScreenshot = async (crop?: CropArea) => {
    try {
      // In a real implementation, we would use html2canvas or a similar library
      // For now, we'll simulate the capture
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const width = crop ? Math.abs(crop.endX - crop.startX) : window.innerWidth;
      const height = crop ? Math.abs(crop.endY - crop.startY) : window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      // Simulate screenshot capture (in production, use html2canvas)
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#333";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Screenshot Preview", width / 2, height / 2);
      ctx.fillText(`${width}x${height}`, width / 2, height / 2 + 24);

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  };

  const handleSaveScreenshot = () => {
    if (!capturedImage) return;

    const annotation: Annotation = {
      id: `screenshot-${Date.now()}`,
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
        type: "screenshot",
        dataUrl: capturedImage,
        cropArea: cropArea
          ? {
              x: Math.min(cropArea.startX, cropArea.endX),
              y: Math.min(cropArea.startY, cropArea.endY),
              width: Math.abs(cropArea.endX - cropArea.startX),
              height: Math.abs(cropArea.endY - cropArea.startY),
            }
          : undefined,
      },
    };

    addAnnotation(annotation);
    handleCancel();
  };

  const handleDownload = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `screenshot-${Date.now()}.png`;
    link.click();
  };

  const handleCancel = () => {
    setShowPreview(false);
    setCapturedImage(null);
    setCropArea(null);
  };

  const handleQuickCapture = () => {
    if (!enabled) return;
    captureScreenshot();
  };

  const getCropStyle = () => {
    if (!cropArea) return {};

    const x = Math.min(cropArea.startX, cropArea.endX);
    const y = Math.min(cropArea.startY, cropArea.endY);
    const width = Math.abs(cropArea.endX - cropArea.startX);
    const height = Math.abs(cropArea.endY - cropArea.startY);

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  if (!enabled && !showPreview) return null;

  return (
    <>
      {/* Crop overlay */}
      {enabled && !showPreview && (
        <div
          cclassName={cn("fixed inset-0 z-40 cursor-crosshair", cclassName)}
          onMouseDown={handleStartCrop}
          onMouseMove={handleMoveCrop}
          onMouseUp={handleEndCrop}
        >
          {isCropping && cropArea && (
            <div cclassName="absolute border-2 border-primary bg-primary/10" style={getCropStyle()}>
              <div cclassName="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-2 rounded text-xs">
                {Math.abs(cropArea.endX - cropArea.startX)} x{" "}
                {Math.abs(cropArea.endY - cropArea.startY)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick capture button */}
      {enabled && !showPreview && (
        <div cclassName="fixed bottom-6 right-6 z-50">
          <Button
            variant="default"
            size="lg"
            cclassName="gap-2 shadow-lg mac-button mac-button-primary"
            onClick={handleQuickCapture}
          >
            <Crop cclassName="h-4 w-4" />
            Quick Capture
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && capturedImage && (
        <div cclassName="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <Card cclassName="mac-card max-w-4xl w-full">
            <CardContent cclassName="p-6">
              <div cclassName="flex items-center justify-between mb-4">
                <h3 cclassName="mac-title">
                  Screenshot Preview
                </h3>
                <Button
                  cclassName="mac-button mac-button-outline"
                  variant="ghost"
                  cclassName="mac-button mac-button-outline"
                  size="icon"
                  onClick={handleCancel}
                >
                  <X cclassName="h-4 w-4" />
                </Button>
              </div>

              <div cclassName="bg-muted rounded-lg p-4 mb-4 max-h-[60vh] overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedImage} alt="Screenshot preview" cclassName="w-full h-auto" />
              </div>

              <div cclassName="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  cclassName="gap-2 mac-button mac-button-outline"
                >
                  <Download cclassName="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="default"
                  onClick={handleSaveScreenshot}
                  cclassName="gap-2 mac-button mac-button-primary"
                >
                  <Check cclassName="h-4 w-4" />
                  Save to Annotations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

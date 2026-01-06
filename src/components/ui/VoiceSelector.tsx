"use client";

import React from "react";
import { ChevronDown, Play, Pause, Volume2, User, Wand2 } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "../../lib/utils";
import { useElevenLabsVoices, ElevenLabsVoice } from "../../hooks/useElevenLabsVoices";

interface VoiceSelectorProps {
  onVoiceSelect: (voiceId: string) => void;
  selectedVoiceId?: string;
  disabled?: boolean;
  className?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  onVoiceSelect,
  selectedVoiceId: externalSelectedVoiceId,
  disabled = false,
  className,
}) => {
  const {
    voices,
    isLoading,
    selectedVoiceId: internalSelectedVoiceId,
    selectVoice,
    getSelectedVoice,
    playPreview,
    stopPreview,
    isPreviewPlaying,
  } = useElevenLabsVoices();

  // Use external voice ID if provided, otherwise use internal state
  const currentVoiceId = externalSelectedVoiceId || internalSelectedVoiceId;
  const currentVoice =
    voices.find((voice) => voice.voice_id === currentVoiceId) || getSelectedVoice();

  const handleVoiceSelect = (voiceId: string) => {
    selectVoice(voiceId);
    onVoiceSelect(voiceId);
  };

  const handlePreviewToggle = (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();

    if (isPreviewPlaying === voiceId) {
      stopPreview();
    } else {
      playPreview(voiceId);
    }
  };

  const getVoiceIcon = (voice?: ElevenLabsVoice) => {
    if (!voice) return <Volume2 className="h-3 w-3" />;
    const gender = voice.labels?.gender?.toLowerCase();
    if (voice.category === "cloned") return <Wand2 className="h-3 w-3" />;
    if (gender === "female") return <User className="h-3 w-3 text-pink-400" />;
    if (gender === "male") return <User className="h-3 w-3 text-blue-400" />;
    return <Volume2 className="h-3 w-3" />;
  };

  const getVoiceDescription = (voice?: ElevenLabsVoice) => {
    if (!voice) return "AI voice";
    const parts = [];
    if (voice.labels?.gender) parts.push(voice.labels.gender);
    if (voice.labels?.accent) parts.push(voice.labels.accent);
    if (voice.labels?.age) parts.push(voice.labels.age.replace("_", " "));
    return parts.join(" • ") || voice.description || "AI voice";
  };

  const getCategoryBadge = (voice?: ElevenLabsVoice) => {
    if (!voice) return null;
    switch (voice.category) {
      case "premade":
        return (
          <Badge variant="secondary" className="text-xs px-2.5 py-0.5">
            Default
          </Badge>
        );
      case "cloned":
        return (
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 text-primary-400 border-primary-400/30"
          >
            Cloned
          </Badge>
        );
      case "generated":
        return (
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 text-blue-400 border-blue-400/30"
          >
            Generated
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn(
          "mac-button mac-button-outline",
          "h-8 px-4 gap-2 mac-glass mac-surface-elevated",
          "animate-pulse",
          className
        )}
      >
        <Volume2 className="h-4 w-4" />
        <span className="text-sm">Loading voices...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "mac-button mac-button-outline",
            "h-8 px-4 gap-2 justify-between min-w-[140px]",
            "mac-glass mac-surface-elevated",
            "hover:bg-white/10 hover:border-white/20",
            "transition-all duration-200",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {getVoiceIcon(currentVoice)}
            <span className="text-sm font-normal truncate max-w-[80px]">
              {currentVoice?.name || "Select Voice"}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-80 p-2",
          "mac-glass mac-surface-elevated",
          "border-white/20 shadow-2xl",
          "backdrop-blur-md"
        )}
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-normal text-white/70 px-2 py-2.5">
          Select Voice Assistant
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        <div className="max-h-64 overflow-y-auto space-y-1">
          {voices.map((voice) => {
            const isSelected = voice.voice_id === currentVoiceId;
            const isPreviewing = isPreviewPlaying === voice.voice_id;

            return (
              <DropdownMenuItem
                key={voice.voice_id}
                onClick={() => handleVoiceSelect(voice.voice_id)}
                className={cn(
                  "p-4 rounded-lg cursor-pointer transition-all duration-200",
                  "hover:bg-white/10 focus:bg-white/10",
                  isSelected && "bg-white/15 border border-white/20",
                  "flex flex-col items-start gap-2"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getVoiceIcon(voice)}
                    <span className="font-normal text-white text-sm">{voice.name}</span>
                    {getCategoryBadge(voice)}
                    {isSelected && (
                      <Badge
                        variant="default"
                        className="text-xs px-2.5 py-0.5 bg-green-500/20 text-green-400 border-green-400/30"
                      >
                        Selected
                      </Badge>
                    )}
                  </div>

                  <Button
                    className="mac-button mac-button-outline"
                    variant="ghost"
                    className="mac-button mac-button-outline"
                    size="sm"
                    onClick={(e) => handlePreviewToggle(e, voice.voice_id)}
                    className={cn(
                      "h-6 w-6 p-0 rounded-full",
                      "hover:bg-white/20 transition-colors",
                      isPreviewing && "bg-blue-500/20 text-blue-400"
                    )}
                  >
                    {isPreviewing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </div>

                <p className="text-xs text-white/60 leading-relaxed">
                  {getVoiceDescription(voice)}
                </p>

                {voice.description && voice.description !== getVoiceDescription(voice) && (
                  <p className="text-xs text-white/40 leading-relaxed italic">
                    "{voice.description}"
                  </p>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        {voices.length === 0 && (
          <div className="p-4 text-center">
            <Volume2 className="h-8 w-8 mx-auto mb-2 text-white/30" />
            <p className="text-sm text-white/60">No voices available</p>
            <p className="text-xs text-white/40 mt-2">Check your API key configuration</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

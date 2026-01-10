"use client";

import React, { useState, useEffect } from "react";
import {
  Bug,
  X,
  Trash2,
  Download,
  AlertTriangle,
  Lightbulb,
  Clock,
  ExternalLink,
  Crosshair,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLadybugCollection,
  deleteLadybugReport,
  clearLadybugCollection,
  exportLadybugCollection,
  getLadybugStats,
  LadybugReport,
} from "../../lib/ladybug-storage";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

interface LadybugCollectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LadybugCollection: React.FC<LadybugCollectionProps> = ({
  isOpen,
  onClose,
}) => {
  const [reports, setReports] = useState<LadybugReport[]>([]);
  const [stats, setStats] = useState({ total: 0, bugs: 0, blockers: 0, features: 0 });
  const [selectedReport, setSelectedReport] = useState<LadybugReport | null>(null);

  // Load reports when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReports(getLadybugCollection());
      setStats(getLadybugStats());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteLadybugReport(id);
    setReports(getLadybugCollection());
    setStats(getLadybugStats());
    setSelectedReport(null);
    toast.success('Report deleted');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all reports? This cannot be undone.')) {
      clearLadybugCollection();
      setReports([]);
      setStats({ total: 0, bugs: 0, blockers: 0, features: 0 });
      setSelectedReport(null);
      toast.success('Collection cleared');
    }
  };

  const handleExport = () => {
    exportLadybugCollection();
    toast.success('Collection exported');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4 text-orange-500" />;
      case 'blocker':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'feature':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'blocker':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'feature':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return '';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mac-card w-full max-w-4xl mx-4 bg-mac-surface-elevated border-mac-border shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-mac-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Bug className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="mac-title text-base font-semibold">The Ladybug Collection</h3>
              <p className="text-xs text-mac-text-muted">
                {stats.total} reports ({stats.bugs} bugs, {stats.blockers} blockers, {stats.features} features)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={reports.length === 0}
              className="p-2 rounded-lg text-mac-text-muted hover:text-mac-text-primary hover:bg-mac-surface-bg/50 transition-colors disabled:opacity-50"
              title="Export Collection"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleClearAll}
              disabled={reports.length === 0}
              className="p-2 rounded-lg text-mac-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              title="Clear All"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-mac-text-muted hover:text-mac-text-primary hover:bg-mac-surface-bg/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Report List */}
          <div className="w-1/3 border-r border-mac-border flex flex-col">
            <ScrollArea className="flex-1">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-mac-text-muted">
                  <Bug className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No reports yet</p>
                  <p className="text-xs mt-1">Click the ladybug to report an issue</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedReport?.id === report.id
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : 'hover:bg-mac-surface-bg/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getTypeIcon(report.issueType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-mac-text-primary truncate">
                            {report.description.slice(0, 50)}
                            {report.description.length > 50 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${getTypeBadgeColor(report.issueType)}`}
                            >
                              {report.issueType}
                            </Badge>
                            <span className="text-[10px] text-mac-text-muted">
                              {report.context}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Report Detail */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedReport ? (
              <>
                <div className="p-4 flex-1 overflow-y-auto">
                  {/* Screenshot */}
                  {selectedReport.screenshot && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-mac-border">
                      <img
                        src={selectedReport.screenshot}
                        alt="Screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Type & Context */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={`capitalize ${getTypeBadgeColor(selectedReport.issueType)}`}
                    >
                      {getTypeIcon(selectedReport.issueType)}
                      <span className="ml-1">{selectedReport.issueType}</span>
                    </Badge>
                    <Badge variant="outline" className="text-mac-text-secondary">
                      {selectedReport.context}
                    </Badge>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-mac-text-secondary mb-1">Description</h4>
                    <p className="text-sm text-mac-text-primary whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 text-xs text-mac-text-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(selectedReport.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3 w-3" />
                      <span>{selectedReport.viewport.width} x {selectedReport.viewport.height}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crosshair className="h-3 w-3" />
                      <span>Position: ({selectedReport.crosshairPosition.x}, {selectedReport.crosshairPosition.y})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{selectedReport.url}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-mac-border flex-shrink-0">
                  <button
                    onClick={() => handleDelete(selectedReport.id)}
                    className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Delete Report
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-mac-text-muted">
                <div className="text-center">
                  <Bug className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Select a report to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

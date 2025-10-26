import React, { Suspense } from "react";
import { AudioWaveformResponse, type AudioWaveformResponseData } from "./AudioWaveformResponse";
import { SearchResultsResponse, type SearchResultsResponseData } from "./SearchResultsResponse";

// Define our response types
export interface BaseResponse {
  type: string;
  id: string;
  timestamp: Date;
  source?: "aoma" | "ai" | "system";
}

export interface JiraTicketResponse extends BaseResponse {
  type: "jira_ticket";
  data: {
    key: string;
    summary: string;
    status: string;
    assignee: string;
    priority: string;
    labels: string[];
    description: string;
    created: Date;
    updated: Date;
    comments: Array<{
      author: string;
      body: string;
      created: Date;
    }>;
  };
}

export interface ChartResponse extends BaseResponse {
  type: "chart";
  data: {
    chartType: "bar" | "line" | "pie" | "area" | "scatter";
    title: string;
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
    labels: string[];
    options?: any;
  };
}

export interface CodeBlockResponse extends BaseResponse {
  type: "code_block";
  data: {
    language: string;
    code: string;
    filename?: string;
    description?: string;
    executable?: boolean;
  };
}

export interface DashboardResponse extends BaseResponse {
  type: "dashboard";
  data: {
    title: string;
    widgets: Array<{
      id: string;
      type: "metric" | "chart" | "table" | "status";
      title: string;
      data: any;
      size: "sm" | "md" | "lg" | "xl";
    }>;
  };
}

export type StructuredResponse =
  | JiraTicketResponse
  | ChartResponse
  | CodeBlockResponse
  | DashboardResponse
  | AudioWaveformResponseData
  | SearchResultsResponseData;

// Server Components for each response type
const JiraTicketRenderer: React.FC<{ response: JiraTicketResponse }> = ({ response }) => {
  const { data } = response;

  const statusColors: Record<string, string> = {
    "To Do": "bg-gray-500",
    "In Progress": "bg-blue-500",
    Done: "bg-green-500",
    Blocked: "bg-red-500",
  };

  const priorityColors: Record<string, string> = {
    Highest: "text-red-600",
    High: "text-orange-500",
    Medium: "text-yellow-500",
    Low: "text-green-500",
    Lowest: "text-gray-500",
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            J
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-mono text-sm">{data.key}</span>
              <span
                className={`px-2 py-2 rounded-full text-xs text-white ${statusColors[data.status] || "bg-gray-500"}`}
              >
                {data.status}
              </span>
            </div>
            <h3 className="mac-title">
              {data.summary}
            </h3>
          </div>
        </div>
        <div className={`text-sm font-medium ${priorityColors[data.priority] || "text-gray-400"}`}>
          {data.priority}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-400">Assignee:</span>
          <span className="text-gray-200 ml-2">{data.assignee}</span>
        </div>
        <div>
          <span className="text-gray-400">Created:</span>
          <span className="text-gray-200 ml-2">{data.created.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Labels */}
      {data.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.labels.map((label, index) => (
            <span
              key={index}
              className="px-2 py-2 bg-purple-600/20 text-purple-300 rounded text-xs border border-purple-500/30"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
        <h4 className="mac-title">
          Description
        </h4>
        <p className="text-gray-200 text-sm leading-relaxed">{data.description}</p>
      </div>

      {/* Comments */}
      {data.comments.length > 0 && (
        <div>
          <h4 className="mac-title">
            Comments ({data.comments.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {data.comments.map((comment, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 text-sm font-medium">{comment.author}</span>
                  <span className="text-gray-400 text-xs">
                    {comment.created.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-200 text-sm">{comment.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Chart Renderer (for now, can be enhanced with a chart library later)
const ChartRenderer: React.FC<{ response: ChartResponse }> = ({ response }) => {
  const { data } = response;

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50">
      <h3 className="mac-title">
        {data.title}
      </h3>

      {/* Simple bar chart visualization */}
      <div className="space-y-4">
        {data.datasets.map((dataset, datasetIndex) => (
          <div key={datasetIndex}>
            <h4 className="mac-title">
              {dataset.label}
            </h4>
            <div className="space-y-2">
              {data.labels.map((label, index) => {
                const value = dataset.data[index] || 0;
                const maxValue = Math.max(...dataset.data);
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm w-20 truncate">{label}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-sm w-12 text-right">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Chart Type: {data.chartType} • {data.datasets.length} dataset(s) • {data.labels.length}{" "}
        labels
      </div>
    </div>
  );
};

const CodeBlockRenderer: React.FC<{ response: CodeBlockResponse }> = ({ response }) => {
  const { data } = response;

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-black/90 rounded-xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="bg-gray-800/80 px-4 py-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-300 text-sm font-mono">
              {data.filename || `code.${data.language}`}
            </span>
            <span className="px-2 py-2 bg-blue-600/20 text-blue-300 rounded text-xs border border-blue-500/30">
              {data.language}
            </span>
          </div>
          {data.executable && (
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors">
              Run
            </button>
          )}
        </div>
        {data.description && <p className="text-gray-400 text-sm mt-2">{data.description}</p>}
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm">
          <code className="text-gray-100 font-mono whitespace-pre">{data.code}</code>
        </pre>
      </div>
    </div>
  );
};

const DashboardRenderer: React.FC<{ response: DashboardResponse }> = ({ response }) => {
  const { data } = response;

  const getGridCols = (size: string) => {
    switch (size) {
      case "sm":
        return "col-span-1";
      case "md":
        return "col-span-2";
      case "lg":
        return "col-span-3";
      case "xl":
        return "col-span-4";
      default:
        return "col-span-2";
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50">
      <h3 className="mac-title">
        {data.title}
      </h3>

      <div className="grid grid-cols-4 gap-4">
        {data.widgets.map((widget) => (
          <div
            key={widget.id}
            className={`${getGridCols(widget.size)} bg-gray-800/50 rounded-lg p-4`}
          >
            <h4 className="mac-title">
              {widget.title}
            </h4>
            {/* Widget content based on type */}
            {widget.type === "metric" && (
              <div className="text-2xl font-bold text-blue-400">
                {widget.data.value}
                <span className="text-sm text-gray-400 ml-2">{widget.data.unit}</span>
              </div>
            )}
            {widget.type === "status" && (
              <div
                className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                  widget.data.status === "healthy"
                    ? "bg-green-600/20 text-green-300 border border-green-500/30"
                    : widget.data.status === "warning"
                      ? "bg-yellow-600/20 text-yellow-300 border border-yellow-500/30"
                      : "bg-red-600/20 text-red-300 border border-red-500/30"
                }`}
              >
                {widget.data.status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Response Renderer Component
export const ResponseRenderer: React.FC<{ response: StructuredResponse }> = ({ response }) => {
  const renderResponse = () => {
    switch (response.type) {
      case "jira_ticket":
        return <JiraTicketRenderer response={response} />;

      case "chart":
        return (
          <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg h-64" />}>
            <ChartRenderer response={response} />
          </Suspense>
        );

      case "code_block":
        return <CodeBlockRenderer response={response} />;

      case "dashboard":
        return <DashboardRenderer response={response} />;

      case "audio_waveform":
        return (
          <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg h-64" />}>
            <AudioWaveformResponse response={response} />
          </Suspense>
        );

      case "search_results":
        return <SearchResultsResponse response={response} />;

      default:
        return <div className="text-red-400">Unknown response type: {(response as any).type}</div>;
    }
  };

  return <div className="w-full">{renderResponse()}</div>;
};

export default ResponseRenderer;

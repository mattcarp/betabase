import React, { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
  Search,
  File,
  ExternalLink,
  Clock,
  Star,
  Tag,
  Filter,
  TrendingUp,
  Eye,
  BookOpen,
  Download,
} from "lucide-react";

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  fullContent?: string;
  url?: string;
  relevanceScore: number;
  type: "document" | "api_doc" | "knowledge_base" | "manual" | "specification" | "tutorial";
  source: {
    name: string;
    system: "aoma" | "confluence" | "sharepoint" | "jira" | "internal_docs";
    icon?: string;
  };
  metadata: {
    lastModified: Date;
    author?: string;
    tags: string[];
    fileSize?: string;
    format?: "pdf" | "html" | "markdown" | "docx" | "json";
    accessLevel: "public" | "internal" | "confidential";
  };
  highlighted: {
    title: string;
    snippet: string;
  };
  relatedTopics?: string[];
  readTime?: number; // estimated minutes
}

export interface SearchResultsData {
  query: string;
  totalResults: number;
  resultsShown: number;
  searchTime: number; // in milliseconds
  results: SearchResult[];
  suggestions?: string[];
  filters: {
    applied: string[];
    available: {
      type: string[];
      source: string[];
      accessLevel: string[];
      dateRange: string[];
    };
  };
  searchStrategy: {
    method: "semantic" | "keyword" | "hybrid";
    confidence: number;
    expandedTerms?: string[];
  };
}

export interface SearchResultsResponseData {
  type: "search_results";
  id: string;
  timestamp: Date;
  source: "aoma" | "ai" | "system";
  data: SearchResultsData;
}

const ResultCard: React.FC<{
  result: SearchResult;
  onOpen: (result: SearchResult) => void;
}> = ({ result, onOpen }) => {
  const getTypeIcon = () => {
    switch (result.type) {
      case "document":
        return <File cclassName="w-4 h-4" />;
      case "api_doc":
        return <BookOpen cclassName="w-4 h-4" />;
      case "knowledge_base":
        return <Search cclassName="w-4 h-4" />;
      case "manual":
        return <BookOpen cclassName="w-4 h-4" />;
      case "specification":
        return <File cclassName="w-4 h-4" />;
      case "tutorial":
        return <TrendingUp cclassName="w-4 h-4" />;
      default:
        return <File cclassName="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (result.type) {
      case "document":
        return "text-blue-400";
      case "api_doc":
        return "text-green-400";
      case "knowledge_base":
        return "text-purple-400";
      case "manual":
        return "text-orange-400";
      case "specification":
        return "text-red-400";
      case "tutorial":
        return "text-blue-600";
      default:
        return "text-gray-400";
    }
  };

  const getAccessLevelColor = () => {
    switch (result.metadata.accessLevel) {
      case "public":
        return "bg-green-600/20 text-green-300 border-green-500/30";
      case "internal":
        return "bg-yellow-600/20 text-yellow-300 border-yellow-500/30";
      case "confidential":
        return "bg-red-600/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-600/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatRelevanceScore = (score: number) => {
    return `${(score * 100).toFixed(0)}%`;
  };

  return (
    <div cclassName="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-lg p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 group">
      {/* Header */}
      <div cclassName="flex items-start justify-between mb-4">
        <div cclassName="flex items-center gap-4 flex-1">
          <div cclassName={`${getTypeColor()}`}>{getTypeIcon()}</div>
          <div cclassName="flex-1 min-w-0">
            <h3
              cclassName="mac-title"
              cclassName="mac-title font-semibold text-gray-100 hover:text-blue-400 cursor-pointer transition-colors truncate"
              onClick={() => onOpen(result)}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.highlighted.title) }}
            />
            <div cclassName="flex items-center gap-2 text-xs text-gray-400 mt-2">
              <span cclassName="capitalize">{result.type.replace("_", " ")}</span>
              <span>•</span>
              <span>{result.source.name}</span>
              {result.readTime && (
                <>
                  <span>•</span>
                  <span cclassName="flex items-center gap-2">
                    <Clock cclassName="w-3 h-3" />
                    {result.readTime} min read
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Relevance Score */}
        <div cclassName="flex items-center gap-2">
          <div cclassName="flex items-center gap-2 px-2 py-2 bg-blue-600/20 rounded-full border border-blue-500/30">
            <Star cclassName="w-3 h-3 text-blue-400" />
            <span cclassName="text-xs text-blue-300 font-medium">
              {formatRelevanceScore(result.relevanceScore)}
            </span>
          </div>
          <span cclassName={`px-2 py-2 rounded text-xs border ${getAccessLevelColor()}`}>
            {result.metadata.accessLevel}
          </span>
        </div>
      </div>

      {/* Snippet */}
      <div cclassName="mb-4">
        <p
          cclassName="text-gray-300 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.highlighted.snippet) }}
        />
      </div>

      {/* Tags */}
      {result.metadata.tags.length > 0 && (
        <div cclassName="flex flex-wrap gap-2 mb-4">
          {result.metadata.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              cclassName="px-2 py-2 bg-gray-700/50 text-gray-300 rounded text-xs flex items-center gap-2"
            >
              <Tag cclassName="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {result.metadata.tags.length > 4 && (
            <span cclassName="text-xs text-gray-400 px-2 py-2">
              +{result.metadata.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Related Topics */}
      {result.relatedTopics && result.relatedTopics.length > 0 && (
        <div cclassName="mb-4">
          <div cclassName="text-xs text-gray-400 mb-2">Related topics:</div>
          <div cclassName="flex flex-wrap gap-2">
            {result.relatedTopics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                cclassName="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div cclassName="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <div cclassName="flex items-center gap-4 text-xs text-gray-400">
          <span>Modified {result.metadata.lastModified.toLocaleDateString()}</span>
          {result.metadata.author && <span>by {result.metadata.author}</span>}
          {result.metadata.fileSize && <span>{result.metadata.fileSize}</span>}
        </div>

        <div cclassName="flex items-center gap-2">
          <button
            onClick={() => onOpen(result)}
            cclassName="p-2.5 hover:bg-gray-700/50 rounded transition-colors"
            title="View details"
          >
            <Eye cclassName="w-3.5 h-3.5 text-gray-400" />
          </button>
          {result.url && (
            <button
              onClick={() => window.open(result.url, "_blank")}
              cclassName="p-2.5 hover:bg-gray-700/50 rounded transition-colors"
              title="Open source"
            >
              <ExternalLink cclassName="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <button cclassName="p-2.5 hover:bg-gray-700/50 rounded transition-colors" title="Download">
            <Download cclassName="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const SearchResultsResponse: React.FC<{
  response: SearchResultsResponseData;
}> = ({ response }) => {
  const { data } = response;
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleOpenResult = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const getStrategyIcon = () => {
    switch (data.searchStrategy.method) {
      case "semantic":
        return "✨";
      case "keyword":
        return "🔍";
      case "hybrid":
        return "⚡";
      default:
        return "🔍";
    }
  };

  return (
    <div cclassName="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
      {/* Header */}
      <div cclassName="flex items-start justify-between mb-6">
        <div cclassName="flex items-center gap-4">
          <div cclassName="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Search cclassName="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 cclassName="mac-title">
              Search Results
            </h3>
            <div cclassName="text-sm text-gray-400">
              <span cclassName="font-medium">"{data.query}"</span> •{" "}
              {data.totalResults.toLocaleString()} results in {data.searchTime}
              ms
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          cclassName="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Filter cclassName="w-4 h-4" />
          <span cclassName="text-sm">Filters</span>
        </button>
      </div>

      {/* Search Strategy & Stats */}
      <div cclassName="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div cclassName="bg-gray-800/50 rounded-lg p-4">
          <div cclassName="text-xs text-gray-400 mb-2">Search Method</div>
          <div cclassName="flex items-center gap-2">
            <span cclassName="text-lg">{getStrategyIcon()}</span>
            <span cclassName="font-medium text-gray-200 capitalize">
              {data.searchStrategy.method}
            </span>
          </div>
        </div>

        <div cclassName="bg-gray-800/50 rounded-lg p-4">
          <div cclassName="text-xs text-gray-400 mb-2">Confidence</div>
          <div cclassName="text-lg font-semibold text-green-400">
            {(data.searchStrategy.confidence * 100).toFixed(0)}%
          </div>
        </div>

        <div cclassName="bg-gray-800/50 rounded-lg p-4">
          <div cclassName="text-xs text-gray-400 mb-2">Results Shown</div>
          <div cclassName="text-lg font-semibold text-blue-400">
            {data.resultsShown} of {data.totalResults}
          </div>
        </div>
      </div>

      {/* Applied Filters */}
      {data.filters.applied.length > 0 && (
        <div cclassName="mb-6">
          <div cclassName="text-sm text-gray-400 mb-2">Active filters:</div>
          <div cclassName="flex flex-wrap gap-2">
            {data.filters.applied.map((filter, index) => (
              <span
                key={index}
                cclassName="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Search Terms */}
      {data.searchStrategy.expandedTerms && data.searchStrategy.expandedTerms.length > 0 && (
        <div cclassName="mb-6">
          <div cclassName="text-sm text-gray-400 mb-2">Also searching for:</div>
          <div cclassName="flex flex-wrap gap-2">
            {data.searchStrategy.expandedTerms.map((term, index) => (
              <span
                key={index}
                cclassName="px-2 py-2 bg-purple-600/20 text-purple-300 rounded text-sm"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div cclassName="space-y-4 mb-6">
        {data.results.map((result) => (
          <ResultCard key={result.id} result={result} onOpen={handleOpenResult} />
        ))}
      </div>

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <div cclassName="bg-gray-900/50 rounded-lg p-4">
          <div cclassName="text-gray-300 font-medium mb-4">Try these related searches:</div>
          <div cclassName="flex flex-wrap gap-2">
            {data.suggestions.map((suggestion, index) => (
              <button
                key={index}
                cclassName="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Load More */}
      {data.resultsShown < data.totalResults && (
        <div cclassName="text-center mt-6">
          <button cclassName="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Load More Results ({data.totalResults - data.resultsShown} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResultsResponse;

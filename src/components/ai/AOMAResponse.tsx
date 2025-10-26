"use client";

import * as React from "react";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationText,
  InlineCitationQuote,
} from "../ai-elements/inline-citation";
import { Response } from "../ai-elements/response";
import { Sources, SourcesTrigger, SourcesContent, Source } from "../ai-elements/source";

interface AOMASource {
  title?: string;
  url?: string;
  description?: string;
  quote?: string;
  id?: string;
}

interface AOMAResponseProps {
  content: string;
  sources?: AOMASource[] | string[];
  metadata?: {
    model?: string;
    duration?: number;
    orchestration?: string;
  };
}

export function AOMAResponse({ content, sources = [], metadata }: AOMAResponseProps) {
  // Parse content for inline citations like [1], [2], etc.
  const renderContentWithCitations = () => {
    if (!sources || sources.length === 0) {
      return <Response>{content}</Response>;
    }

    // Convert string sources to object format
    const normalizedSources: AOMASource[] = sources.map((source, index) => {
      if (typeof source === "string") {
        return {
          id: `source-${index + 1}`,
          title: source,
          description: source,
        };
      }
      return source;
    });

    // Split content by citation markers [1], [2], etc.
    const parts = content.split(/(\[\d+\])/g);

    return (
      <Response>
        {parts.map((part, index) => {
          const citationMatch = part.match(/\[(\d+)\]/);

          if (citationMatch) {
            const citationIndex = parseInt(citationMatch[1]) - 1;
            const citation = normalizedSources[citationIndex];

            if (!citation) return <InlineCitationText key={index}>{part}</InlineCitationText>;

            return (
              <InlineCitation key={index}>
                <InlineCitationCard>
                  <InlineCitationCardTrigger
                    sources={
                      citation.url ? [citation.url] : [citation.title || "AOMA Knowledge Base"]
                    }
                  />
                  <InlineCitationCardBody>
                    {normalizedSources.length > 1 ? (
                      <InlineCitationCarousel>
                        <InlineCitationCarouselHeader>
                          <InlineCitationCarouselPrev />
                          <InlineCitationCarouselNext />
                          <InlineCitationCarouselIndex />
                        </InlineCitationCarouselHeader>
                        <InlineCitationCarouselContent>
                          {normalizedSources.map((source, idx) => (
                            <InlineCitationCarouselItem key={idx}>
                              <InlineCitationSource
                                title={source.title || `AOMA Source ${idx + 1}`}
                                url={source.url}
                                description={source.description}
                              />
                              {source.quote && (
                                <InlineCitationQuote>{source.quote}</InlineCitationQuote>
                              )}
                            </InlineCitationCarouselItem>
                          ))}
                        </InlineCitationCarouselContent>
                      </InlineCitationCarousel>
                    ) : (
                      <InlineCitationSource
                        title={citation.title || "AOMA Knowledge Base"}
                        url={citation.url}
                        description={citation.description}
                      />
                    )}
                  </InlineCitationCardBody>
                </InlineCitationCard>
              </InlineCitation>
            );
          }

          return <InlineCitationText key={index}>{part}</InlineCitationText>;
        })}

        {metadata && (
          <div cclassName="mt-4 text-xs text-muted-foreground">
            {metadata.model && <span>Model: {metadata.model} • </span>}
            {metadata.orchestration && <span>Strategy: {metadata.orchestration} • </span>}
            {metadata.duration && <span>Duration: {metadata.duration}ms</span>}
          </div>
        )}
      </Response>
    );
  };

  return (
    <div cclassName="aoma-response space-y-4">
      {renderContentWithCitations()}

      {/* Add Sources list at the bottom using AI Elements */}
      {sources && sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((source, index) => {
              const normalizedSource =
                typeof source === "string" ? { title: source, description: source } : source;

              return (
                <Source
                  key={index}
                  href={normalizedSource.url}
                  title={normalizedSource.title || `Source ${index + 1}`}
                >
                  {normalizedSource.description && (
                    <span cclassName="text-xs text-muted-foreground ml-6">
                      {normalizedSource.description}
                    </span>
                  )}
                </Source>
              );
            })}
          </SourcesContent>
        </Sources>
      )}
    </div>
  );
}

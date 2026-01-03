"use client";

import { CodeBlock } from "../ui/code-block";
import type { /* ComponentProps, */ HTMLAttributes } from "react";
import { memo, isValidElement } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
// import rehypeKatex from "rehype-katex"; // TEMPORARILY DISABLED - MISSING DEPENDENCY
import remarkGfm from "remark-gfm";
// import remarkMath from "remark-math"; // TEMPORARILY DISABLED - MISSING DEPENDENCY
import { cn } from "../../lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
// import "katex/dist/katex.min.css"; // TEMPORARILY DISABLED - MISSING DEPENDENCY
// import hardenReactMarkdown from "harden-react-markdown"; // TEMPORARILY DISABLED - MISSING DEPENDENCY

/**
 * Parses markdown text and removes incomplete tokens to prevent partial rendering
 * of links, images, bold, and italic formatting during streaming.
 */
function parseIncompleteMarkdown(text: string): string {
  if (!text || typeof text !== "string") {
    return text;
  }

  let result = text;

  // Handle incomplete links and images
  // Pattern: [...] or ![...] where the closing ] is missing
  const linkImagePattern = /(!?\[)([^\]]*?)$/;
  const linkMatch = result.match(linkImagePattern);
  if (linkMatch) {
    // If we have an unterminated [ or ![, remove it and everything after
    const startIndex = result.lastIndexOf(linkMatch[1]);
    result = result.substring(0, startIndex);
  }

  // Handle incomplete bold formatting (**)
  const boldPattern = /(\*\*)([^*]*?)$/;
  const boldMatch = result.match(boldPattern);
  if (boldMatch) {
    // Count the number of ** in the entire string
    const asteriskPairs = (result.match(/\*\*/g) || []).length;
    // If odd number of **, we have an incomplete bold - complete it
    if (asteriskPairs % 2 === 1) {
      result = `${result}**`;
    }
  }

  // Handle incomplete italic formatting (__)
  const italicPattern = /(__)([^_]*?)$/;
  const italicMatch = result.match(italicPattern);
  if (italicMatch) {
    // Count the number of __ in the entire string
    const underscorePairs = (result.match(/__/g) || []).length;
    // If odd number of __, we have an incomplete italic - complete it
    if (underscorePairs % 2 === 1) {
      result = `${result}__`;
    }
  }

  // Handle incomplete single asterisk italic (*)
  const singleAsteriskPattern = /(\*)([^*]*?)$/;
  const singleAsteriskMatch = result.match(singleAsteriskPattern);
  if (singleAsteriskMatch) {
    // Count single asterisks that aren't part of **
    const singleAsterisks = result.split("").reduce((acc, char, index) => {
      if (char === "*") {
        // Check if it's part of a ** pair
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== "*" && nextChar !== "*") {
          return acc + 1;
        }
      }
      return acc;
    }, 0);

    // If odd number of single *, we have an incomplete italic - complete it
    if (singleAsterisks % 2 === 1) {
      result = `${result}*`;
    }
  }

  // Handle incomplete single underscore italic (_)
  const singleUnderscorePattern = /(_)([^_]*?)$/;
  const singleUnderscoreMatch = result.match(singleUnderscorePattern);
  if (singleUnderscoreMatch) {
    // Count single underscores that aren't part of __
    const singleUnderscores = result.split("").reduce((acc, char, index) => {
      if (char === "_") {
        // Check if it's part of a __ pair
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== "_" && nextChar !== "_") {
          return acc + 1;
        }
      }
      return acc;
    }, 0);

    // If odd number of single _, we have an incomplete italic - complete it
    if (singleUnderscores % 2 === 1) {
      result = `${result}_`;
    }
  }

  // Handle incomplete inline code blocks (`) - but avoid code blocks (```)
  const inlineCodePattern = /(`)([^`]*?)$/;
  const inlineCodeMatch = result.match(inlineCodePattern);
  if (inlineCodeMatch) {
    // Check if we're dealing with a code block (triple backticks)
    // const hasCodeBlockStart = result.includes("```"); // Unused
    // const codeBlockPattern = /```[\s\S]*?```/g;
    // const completeCodeBlocks = (result.match(codeBlockPattern) || []).length; // Unused
    const allTripleBackticks = (result.match(/```/g) || []).length;

    // If we have an odd number of ``` sequences, we're inside an incomplete code block
    // In this case, don't complete inline code
    const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;

    if (!insideIncompleteCodeBlock) {
      // Count the number of single backticks that are NOT part of triple backticks
      let singleBacktickCount = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i] === "`") {
          // Check if this backtick is part of a triple backtick sequence
          const isTripleStart = result.substring(i, i + 3) === "```";
          const isTripleMiddle = i > 0 && result.substring(i - 1, i + 2) === "```";
          const isTripleEnd = i > 1 && result.substring(i - 2, i + 1) === "```";

          if (!isTripleStart && !isTripleMiddle && !isTripleEnd) {
            singleBacktickCount++;
          }
        }
      }

      // If odd number of single backticks, we have an incomplete inline code - complete it
      if (singleBacktickCount % 2 === 1) {
        result = `${result}\``;
      }
    }
  }

  // Handle incomplete strikethrough formatting (~~)
  const strikethroughPattern = /(~~)([^~]*?)$/;
  const strikethroughMatch = result.match(strikethroughPattern);
  if (strikethroughMatch) {
    // Count the number of ~~ in the entire string
    const tildePairs = (result.match(/~~/g) || []).length;
    // If odd number of ~~, we have an incomplete strikethrough - complete it
    if (tildePairs % 2 === 1) {
      result = `${result}~~`;
    }
  }

  return result;
}

// Create a hardened version of ReactMarkdown
// const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown); // TEMPORARILY DISABLED
const HardenedMarkdown = ReactMarkdown; // Using regular ReactMarkdown for now

export type ResponseProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children: Options["children"];
  allowedImagePrefixes?: string[]; // ComponentProps<ReturnType<typeof hardenReactMarkdown>>["allowedImagePrefixes"];
  allowedLinkPrefixes?: string[]; // ComponentProps<ReturnType<typeof hardenReactMarkdown>>["allowedLinkPrefixes"];
  defaultOrigin?: string; // ComponentProps<ReturnType<typeof hardenReactMarkdown>>["defaultOrigin"];
  parseIncompleteMarkdown?: boolean;
};

const components: Options["components"] = {
  ol: ({ node, children, className, ...props }) => (
    <ol className={cn("ml-4 list-outside list-decimal", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ node, children, className, ...props }) => (
    <li className={cn("py-1", className)} {...props}>
      {children}
    </li>
  ),
  ul: ({ node, children, className, ...props }) => (
    <ul className={cn("ml-4 list-outside list-decimal", className)} {...props}>
      {children}
    </ul>
  ),
  strong: ({ node, children, className, ...props }) => (
    <span className={cn("font-normal", className)} {...props}>
      {children}
    </span>
  ),
  a: ({ node, children, className, ...props }) => (
    <a
      className={cn("font-medium text-primary underline", className)}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ node, children, className, ...props }) => (
    <h1 className={cn("mt-6 mb-2 font-light text-3xl text-primary", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, className, ...props }) => (
    <h2 className={cn("mt-6 mb-2 font-light text-2xl text-primary", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, className, ...props }) => (
    <h3 className={cn("mt-6 mb-2 font-light text-xl text-primary", className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, className, ...props }) => (
    <h4 className={cn("mt-6 mb-2 font-light text-lg text-primary", className)} {...props}>
      {children}
    </h4>
  ),
  h5: ({ node, children, className, ...props }) => (
    <h5 className={cn("mt-6 mb-2 font-light text-base text-primary", className)} {...props}>
      {children}
    </h5>
  ),
  h6: ({ node, children, className, ...props }) => (
    <h6 className={cn("mt-6 mb-2 font-light text-sm text-primary", className)} {...props}>
      {children}
    </h6>
  ),
  table: ({ node, children, className, ...props }) => (
    <div className="my-4">
      <Table className={className} {...props}>
        {children}
      </Table>
    </div>
  ),
  thead: ({ node, children, className, ...props }) => (
    <TableHeader className={className} {...props}>
      {children}
    </TableHeader>
  ),
  tbody: ({ node, children, className, ...props }) => (
    <TableBody className={className} {...props}>
      {children}
    </TableBody>
  ),
  tr: ({ node, children, className, ...props }) => (
    <TableRow className={className} {...props}>
      {children}
    </TableRow>
  ),
  th: ({ node, children, className, ...props }) => (
    <TableHead className={className} {...props}>
      {children}
    </TableHead>
  ),
  td: ({ node, children, className, ...props }) => (
    <TableCell className={className} {...props}>
      {children}
    </TableCell>
  ),
  blockquote: ({ node, children, className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ node, className, ...props }) => {
    const inline = node?.position?.start.line === node?.position?.end.line;

    if (!inline) {
      return <code className={className} {...props} />;
    }

    // Teal-themed inline code with MAC Design System tokens
    return (
      <code
        className={cn(
          "rounded px-1.5 py-0.5 font-mono text-sm",
          "bg-[var(--mac-code-bg)] text-[var(--mac-code-text)] border border-[var(--mac-code-border)]",
          className
        )}
        {...props}
      />
    );
  },
  pre: ({ node, className, children }) => {
    let language = "typescript";
    let filename = "";

    if (typeof node?.properties?.className === "string") {
      const langClass = node.properties.className.replace("language-", "");
      // Support format like "typescript:path/to/file.ts" or "typescript"
      if (langClass.includes(":")) {
        const [lang, path] = langClass.split(":");
        language = lang;
        filename = path;
      } else {
        language = langClass;
      }
    }

    // Extract code content from children safely
    let code = "";
    if (
      isValidElement(children) &&
      children.props &&
      (children.props as any).children &&
      typeof (children.props as any).children === "string"
    ) {
      code = (children.props as any).children;
    } else if (typeof children === "string") {
      code = children;
    }

    return (
      <div className="my-4">
        <CodeBlock
          code={code.trim()}
          language={language as any}
          filename={filename || undefined}
          showLineNumbers
          className="shadow-lg"
        />
      </div>
    );
  },
};

export const Response = memo(
  ({
    className,
    options,
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    ...props
  }: ResponseProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const parsedChildren =
      typeof children === "string" && shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children;

    return (
      <div
        className={cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
        {...props}
      >
        <HardenedMarkdown
          components={components}
          // rehypePlugins={[rehypeKatex]} // TEMPORARILY DISABLED - MISSING DEPENDENCY
          remarkPlugins={[remarkGfm]} // remarkMath temporarily disabled
          // allowedImagePrefixes={allowedImagePrefixes ?? ["*"]} // Hardened props disabled
          // allowedLinkPrefixes={allowedLinkPrefixes ?? ["*"]} // Hardened props disabled
          // defaultOrigin={defaultOrigin} // Hardened props disabled
          {...options}
        >
          {parsedChildren}
        </HardenedMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";

"use client";

import * as React from "react";
import { replacePlaceholders } from "./placeholder-utils";

export type BodySegment =
  | { type: "text"; content: string }
  | { type: "code"; lang: string; content: string };

/**
 * Splits body text into segments: plain text and fenced code blocks (```lang\n...\n```).
 * Placeholders should be replaced before calling this.
 */
export function parseBodyWithCodeBlocks(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > lastEnd) {
      segments.push({
        type: "text",
        content: body.slice(lastEnd, m.index),
      });
    }
    segments.push({
      type: "code",
      lang: m[1]?.trim() || "text",
      content: m[2]?.replace(/\n$/, "") ?? "",
    });
    lastEnd = re.lastIndex;
  }
  if (lastEnd < body.length) {
    segments.push({ type: "text", content: body.slice(lastEnd) });
  }
  return segments.length > 0 ? segments : [{ type: "text", content: body }];
}

export interface RenderedEmailBodyProps {
  body: string;
  placeholderValues: Record<string, string>;
  className?: string;
}

/**
 * Renders email body with {{placeholders}} replaced and ``` code blocks as formatted blocks.
 */
export function RenderedEmailBody({
  body,
  placeholderValues,
  className,
}: Readonly<RenderedEmailBodyProps>) {
  const resolved = replacePlaceholders(body, placeholderValues);
  const segments = parseBodyWithCodeBlocks(resolved);

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        const key =
          seg.type === "text"
            ? `text-${i}-${seg.content.slice(0, 40)}`
            : `code-${i}-${seg.lang}-${seg.content.slice(0, 20)}`;
        return seg.type === "text" ? (
          <span key={key} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            {seg.content}
          </span>
        ) : (
          <pre
            key={key}
            className="my-2 overflow-x-auto rounded-md border border-border bg-muted/80 px-3 py-2 text-sm font-mono"
          >
            <code
              data-language={seg.lang}
              className={`language-${seg.lang} block whitespace-pre text-foreground`}
            >
              {seg.content}
            </code>
          </pre>
        );
      })}
    </div>
  );
}

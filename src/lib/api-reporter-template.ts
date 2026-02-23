export interface ApiReporterInputs {
  endpoint: string;
  method: string;
  expected: string;
  actual: string;
  environment?: string;
  requestPayload?: string;
  contentType?: string;
}

export function buildApiIssueMarkdown(inputs: ApiReporterInputs): string {
  const { endpoint, method, expected, actual, environment, requestPayload, contentType } = inputs;
  const env = environment?.trim() || "N/A";
  const contentLabel = contentType ? ` (${contentType})` : "";
  const payloadBlock =
    requestPayload?.trim() ?
      `

### Request payload${contentLabel}
\`\`\`${contentType?.toLowerCase() ?? "json"}
${requestPayload.trim()}
\`\`\``
    : "";

  const expectedBlock = expected.trim()
    ? `

### Expected
${expected.trim()}`
    : "";

  const responseLang = contentType?.toLowerCase() ?? "json";
  const actualLabel = contentType ? ` — ${contentType}` : "";
  const actualBlock = `

### Actual (Response)${actualLabel}
\`\`\`${responseLang}
${actual.trim() || "(not provided)"}
\`\`\``;

  return `## API Issue

**Endpoint:** \`${method} ${endpoint}\`
**Environment:** ${env}
${payloadBlock}
${expectedBlock}
${actualBlock}
`;
}

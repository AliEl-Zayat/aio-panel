import { ApiReporterClient } from "@/components/api-reporter-client";

export default function ApiReporterPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">API Reporter</h2>
      <ApiReporterClient />
    </div>
  );
}

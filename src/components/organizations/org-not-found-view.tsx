import Link from "next/link";

export function OrgNotFoundView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">Organization not found</h2>
      <p className="text-muted-foreground">
        The organization may have been removed or you do not have access.
      </p>
      <Link
        href="/dashboard/organizations"
        className="text-primary hover:underline font-medium"
      >
        ← Back to organizations
      </Link>
    </div>
  );
}

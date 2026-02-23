import Link from "next/link";
import { OrgDetailPage } from "./org-detail-page";

type PageProps = { params: Promise<{ id: string }> };

function NotFoundView() {
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

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) {
    return <NotFoundView />;
  }
  return <OrgDetailPage id={numId} />;
}

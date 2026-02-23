import { OrgNotFoundView } from "@/components/organizations/org-not-found-view";
import { OrgDetailPage } from "./org-detail-page";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) {
    return <OrgNotFoundView />;
  }
  return <OrgDetailPage id={numId} />;
}

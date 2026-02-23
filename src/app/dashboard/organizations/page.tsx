import { OrganizationsList } from "@/components/organizations/organizations-list";

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">Organizations</h2>
      <OrganizationsList />
    </div>
  );
}

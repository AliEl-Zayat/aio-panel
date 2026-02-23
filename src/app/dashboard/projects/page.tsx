import { ProjectsList } from "@/components/projects/projects-list";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">Projects</h2>
      <ProjectsList />
    </div>
  );
}

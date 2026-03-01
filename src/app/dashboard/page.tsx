import { ReminderBanner } from "@/components/finance-helper/reminder-banner";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <ReminderBanner />
      <h2 className="text-xl font-medium">Welcome</h2>
      <p className="text-muted-foreground mt-1">
        This is your protected dashboard. You can add more content here.
      </p>
    </div>
  );
}

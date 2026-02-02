import { Kanban } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Projects</h2>
          <p className="text-stone-500 text-sm mt-1">
            Track edition production from research to publish
          </p>
        </div>
        <Badge variant="secondary">Phase 5</Badge>
      </div>

      <Card>
        <CardHeader className="text-center py-16">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <Kanban className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-stone-700">Coming in Phase 5</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Kanban-style project tracking for edition production. Manage stages
            from initial research through content creation, design, and publishing.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

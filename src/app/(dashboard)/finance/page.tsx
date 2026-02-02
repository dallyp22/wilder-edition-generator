import { DollarSign } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Finance</h2>
          <p className="text-stone-500 text-sm mt-1">
            Revenue tracking, costs, and financial projections
          </p>
        </div>
        <Badge variant="secondary">Phase 6</Badge>
      </div>

      <Card>
        <CardHeader className="text-center py-16">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-stone-700">Coming in Phase 6</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Financial dashboard with subscription revenue tracking, API cost
            monitoring, per-edition economics, and growth projections.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

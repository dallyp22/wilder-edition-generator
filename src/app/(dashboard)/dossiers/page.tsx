import { Globe } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DossiersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">City Dossiers</h2>
          <p className="text-stone-500 text-sm mt-1">
            Deep-dive research across 10 domains per city
          </p>
        </div>
        <Badge variant="secondary">Phase 2</Badge>
      </div>

      <Card>
        <CardHeader className="text-center py-16">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-stone-700">Coming in Phase 2</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            City Dossiers will generate comprehensive research across 10 domains:
            Landscape, Animals, Plants, Food, Weather, Places, Culture, Sensory,
            Developmental, and Cross-Media references.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

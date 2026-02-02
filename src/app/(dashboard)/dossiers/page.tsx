"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, Plus, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DossierListItem {
  id: string;
  status: string;
  version: number;
  generatedAt: string | null;
  createdAt: string;
  cityName: string | null;
  cityState: string | null;
}

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<DossierListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dossier/list")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dossiers");
        return res.json();
      })
      .then((data) => setDossiers(data.dossiers || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">City Dossiers</h2>
          <p className="text-stone-500 text-sm mt-1">
            Deep-dive research across 10 domains per city
          </p>
        </div>
        <Link href="/dossiers/new">
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            <Plus className="w-4 h-4 mr-2" />
            New Dossier
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-stone-400 text-sm">Loading dossiers...</div>
      ) : dossiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dossiers.map((dossier) => (
            <Link key={dossier.id} href={`/dossiers/${dossier.id}`}>
              <Card className="hover:border-emerald-300 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <Badge
                      variant={dossier.status === "complete" ? "default" : "secondary"}
                    >
                      {dossier.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {dossier.cityName}, {dossier.cityState}
                  </CardTitle>
                  <CardDescription>
                    {dossier.generatedAt
                      ? `Generated ${new Date(dossier.generatedAt).toLocaleDateString()}`
                      : `Created ${new Date(dossier.createdAt).toLocaleDateString()}`}
                    {" "}| v{dossier.version}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center py-16">
            <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <CardTitle className="text-stone-700">No dossiers yet</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Generate your first city dossier to research landscape, animals,
              plants, food, weather, places, culture, sensory details,
              developmental tie-ins, and cross-media hooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link href="/dossiers/new">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Generate First Dossier
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

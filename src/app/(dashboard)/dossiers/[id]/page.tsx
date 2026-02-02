"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DossierViewer } from "@/components/dossier/dossier-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function DossierViewPage() {
  const params = useParams();
  const id = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dossier/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Dossier not found");
          throw new Error("Failed to load dossier");
        }
        return res.json();
      })
      .then((data) => setDossier(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12 text-stone-400 text-sm">
        Loading dossier...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
        <Link href="/dossiers">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dossiers
          </Button>
        </Link>
      </div>
    );
  }

  if (!dossier) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dossiers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              {dossier.city?.name || "City"}, {dossier.city?.state || "State"}
            </h2>
            <p className="text-stone-500 text-sm mt-0.5">
              City Dossier v{dossier.version}
              {dossier.generatedAt && (
                <> | Generated {new Date(dossier.generatedAt).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
        <Badge variant={dossier.status === "complete" ? "default" : "secondary"}>
          {dossier.status}
        </Badge>
      </div>

      <DossierViewer dossier={dossier} />
    </div>
  );
}

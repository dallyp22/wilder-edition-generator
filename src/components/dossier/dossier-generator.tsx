"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DossierDomain,
  DossierProgress,
  DOSSIER_DOMAINS,
  DOMAIN_LABELS,
  DOMAIN_SLUGS,
} from "@/lib/types/dossier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Globe, ArrowRight } from "lucide-react";

// Reverse lookup: domain key → URL slug
const SLUG_BY_DOMAIN: Record<DossierDomain, string> = Object.fromEntries(
  Object.entries(DOMAIN_SLUGS).map(([slug, domain]) => [domain, slug])
) as Record<DossierDomain, string>;

async function apiCall(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API call failed: ${res.status}`);
  }
  return res.json();
}

export function DossierGenerator() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<DossierProgress[]>([]);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback(
    (domain: DossierDomain, status: DossierProgress["status"], errorMessage?: string) => {
      setProgress((prev) =>
        prev.map((p) =>
          p.domain === domain ? { ...p, status, errorMessage } : p
        )
      );
    },
    []
  );

  const handleGenerate = async () => {
    if (!city.trim() || !state.trim()) return;

    setIsGenerating(true);
    setError(null);
    setDossierId(null);
    setProgress(
      DOSSIER_DOMAINS.map((d) => ({ domain: d, status: "pending" as const }))
    );

    try {
      // Step 1: Create dossier record
      const createData = await apiCall("/api/dossier/create", {
        body: JSON.stringify({ city: city.trim(), state: state.trim() }),
      });

      const newDossierId = createData.dossierId;
      setDossierId(newDossierId);

      // Step 2: Research all 10 domains in parallel
      let completedCount = 0;
      let failedCount = 0;

      const researchPromises = DOSSIER_DOMAINS.map(async (domain) => {
        const slug = SLUG_BY_DOMAIN[domain];
        try {
          updateProgress(domain, "researching");

          const resData = await apiCall(`/api/dossier/research/${slug}`, {
            body: JSON.stringify({ city: city.trim(), state: state.trim() }),
          });

          // Save to database
          updateProgress(domain, "saving");
          await apiCall("/api/dossier/update", {
            body: JSON.stringify({
              dossierId: newDossierId,
              domain,
              data: resData.data,
            }),
          });

          completedCount++;
          updateProgress(domain, "complete");
          return { domain, success: true };
        } catch (err) {
          failedCount++;
          const msg = err instanceof Error ? err.message : "Unknown error";
          console.error(`[Dossier] ${domain} failed:`, msg);
          updateProgress(domain, "error", msg);
          return { domain, success: false };
        }
      });

      await Promise.all(researchPromises);

      // Step 3: Finalize
      if (completedCount > 0) {
        await apiCall("/api/dossier/finalize", {
          body: JSON.stringify({ dossierId: newDossierId }),
        });
      }

      if (failedCount === DOSSIER_DOMAINS.length) {
        setError("All domains failed. Check API keys and try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedDomains = progress.filter((p) => p.status === "complete").length;
  const failedDomains = progress.filter((p) => p.status === "error").length;
  const isComplete = !isGenerating && dossierId && completedDomains > 0;

  return (
    <div className="space-y-6">
      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Generate City Dossier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Lincoln"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="e.g., NE"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!city.trim() || !state.trim() || isGenerating}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Researching {completedDomains}/{DOSSIER_DOMAINS.length} domains...
              </>
            ) : (
              "Generate Dossier"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <p className="font-semibold">Generation Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Progress */}
      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Research Progress
              {isComplete && (
                <span className="ml-2 text-sm font-normal text-emerald-600">
                  {completedDomains} of {DOSSIER_DOMAINS.length} domains complete
                  {failedDomains > 0 && ` (${failedDomains} failed)`}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {progress.map((p) => (
                <div
                  key={p.domain}
                  className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white"
                >
                  <span className="text-sm font-medium text-stone-700">
                    {DOMAIN_LABELS[p.domain]}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.status === "pending" && (
                      <span className="text-xs text-stone-400">Waiting</span>
                    )}
                    {(p.status === "researching" || p.status === "saving") && (
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    )}
                    {p.status === "complete" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {p.status === "error" && (
                      <span className="flex items-center gap-1" title={p.errorMessage}>
                        <XCircle className="w-4 h-4 text-red-500" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {isComplete && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="font-semibold text-emerald-900">
                Dossier generated for {city}, {state}
              </p>
              <p className="text-sm text-emerald-700">
                {completedDomains} domains researched and saved
              </p>
            </div>
            <Button
              onClick={() => router.push(`/dossiers/${dossierId}`)}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              View Dossier
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, MapPin, Calendar, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EditionSummary {
  id: string;
  city: string;
  state: string;
  templateVersion: string;
  placeCount: number;
  status: string;
  summary: {
    recommended?: number;
    consider?: number;
    weekMatchCount?: number;
  } | null;
  createdAt: string;
}

export default function EditionsPage() {
  const [editions, setEditions] = useState<EditionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/editions/list")
      .then((res) => res.json())
      .then((data) => setEditions(data.editions || []))
      .catch((err) => console.error("Failed to load editions:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Editions</h2>
          <p className="text-stone-500 text-sm mt-1">
            Generate and manage city editions
          </p>
        </div>
        <Link href="/editions/new">
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            <Plus className="w-4 h-4 mr-2" />
            New Edition
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-stone-200 rounded w-2/3" />
                <div className="h-4 bg-stone-100 rounded w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-stone-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : editions.length === 0 ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-stone-400" />
            </div>
            <CardTitle className="text-stone-700">No editions yet</CardTitle>
            <CardDescription>
              Generate your first edition to see it listed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link href="/editions/new">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Generate First Edition
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {editions.map((edition) => {
            const summary = edition.summary || {};
            const date = new Date(edition.createdAt);
            const dateStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Link key={edition.id} href={`/editions/${edition.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {edition.city}, {edition.state}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {edition.templateVersion} template
                        </CardDescription>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        edition.status === "complete"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {edition.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {edition.placeCount} places
                      </span>
                      {summary.recommended != null && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {summary.recommended} rec
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

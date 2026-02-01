"use client";

import { TemplateSelection } from "@/lib/types";
import { Layout } from "lucide-react";

interface TemplateCardProps {
  template: TemplateSelection;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
          <Layout className="w-4 h-4 text-violet-700" />
        </div>
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
          Template Selection
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-stone-500 text-xs uppercase tracking-wide mb-1">
            Primary Template
          </p>
          <p className="font-semibold text-stone-900">
            {template.primaryTemplate}
          </p>
        </div>
        <div>
          <p className="text-stone-500 text-xs uppercase tracking-wide mb-1">
            Secondary Template
          </p>
          <p className="font-semibold text-stone-900">
            {template.secondaryTemplate}
          </p>
        </div>
        <div>
          <p className="text-stone-500 text-xs uppercase tracking-wide mb-1">
            Population Tier
          </p>
          <p className="font-medium text-stone-700 capitalize">
            {template.populationTier}
          </p>
        </div>
        <div>
          <p className="text-stone-500 text-xs uppercase tracking-wide mb-1">
            Climate Zone
          </p>
          <p className="font-medium text-stone-700 capitalize">
            {template.climateZone}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-stone-50 rounded-lg">
        <p className="text-xs text-stone-600">{template.reasoning}</p>
      </div>
    </div>
  );
}

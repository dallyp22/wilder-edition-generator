"use client";

import { StepProgress } from "@/lib/types";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

interface PipelineProgressProps {
  steps: StepProgress[];
}

function StepIcon({ status }: { status: StepProgress["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "running":
      return <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Circle className="w-5 h-5 text-stone-300" />;
  }
}

export default function PipelineProgress({ steps }: PipelineProgressProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
          Pipeline Progress
        </h3>
        <span className="text-xs font-medium text-stone-500">
          {completedCount}/{steps.length} steps
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-100 rounded-full h-2 mb-5">
        <div
          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${(completedCount / steps.length) * 100}%`,
          }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.step} className="flex items-start gap-3">
            <div className="mt-0.5">
              <StepIcon status={step.status} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.status === "running"
                    ? "text-amber-700"
                    : step.status === "completed"
                      ? "text-emerald-700"
                      : step.status === "error"
                        ? "text-red-600"
                        : "text-stone-400"
                }`}
              >
                {step.label}
              </p>
              {step.detail && (
                <p className="text-xs text-stone-500 mt-0.5">{step.detail}</p>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="hidden" /> // connector line handled by spacing
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

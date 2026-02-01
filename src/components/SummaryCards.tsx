"use client";

import { Place } from "@/lib/types";
import { CheckCircle2, AlertTriangle, Eye, XCircle } from "lucide-react";

interface SummaryCardsProps {
  places: Partial<Place>[];
}

export default function SummaryCards({ places }: SummaryCardsProps) {
  const recommended = places.filter(
    (p) => p.validationStatus === "RECOMMENDED"
  ).length;
  const consider = places.filter(
    (p) => p.validationStatus === "CONSIDER"
  ).length;
  const review = places.filter(
    (p) => p.validationStatus === "REVIEW"
  ).length;
  const reject = places.filter(
    (p) => p.validationStatus === "REJECT"
  ).length;

  const cards = [
    {
      label: "Recommended",
      count: recommended,
      icon: CheckCircle2,
      color: "emerald",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      iconColor: "text-emerald-600",
    },
    {
      label: "Consider",
      count: consider,
      icon: AlertTriangle,
      color: "amber",
      bg: "bg-amber-50",
      text: "text-amber-700",
      iconColor: "text-amber-600",
    },
    {
      label: "Review",
      count: review,
      icon: Eye,
      color: "orange",
      bg: "bg-orange-50",
      text: "text-orange-700",
      iconColor: "text-orange-600",
    },
    {
      label: "Rejected",
      count: reject,
      icon: XCircle,
      color: "red",
      bg: "bg-red-50",
      text: "text-red-700",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-xl p-4 border border-stone-100`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              {card.label}
            </span>
          </div>
          <p className={`text-2xl font-bold ${card.text}`}>{card.count}</p>
        </div>
      ))}
    </div>
  );
}

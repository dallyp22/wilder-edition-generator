"use client";

import { useState } from "react";
import { Place, PlaceCategory, ValidationStatus } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/config/categories";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
} from "lucide-react";

interface ResultsTableProps {
  places: Partial<Place>[];
}

function StatusBadge({ status }: { status: ValidationStatus }) {
  const styles: Record<ValidationStatus, string> = {
    RECOMMENDED: "bg-emerald-100 text-emerald-800",
    CONSIDER: "bg-amber-100 text-amber-800",
    REVIEW: "bg-orange-100 text-orange-800",
    REJECT: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PriceBadge({ tier }: { tier: string }) {
  const display: Record<string, { label: string; style: string }> = {
    FREE: { label: "FREE", style: "bg-emerald-100 text-emerald-800" },
    "$5_$10": { label: "$5-$10", style: "bg-blue-100 text-blue-800" },
    "$10_$15": { label: "$10-$15", style: "bg-amber-100 text-amber-800" },
    "$15_plus": { label: "$15+", style: "bg-red-100 text-red-800" },
  };

  const d = display[tier] || { label: tier, style: "bg-stone-100 text-stone-600" };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${d.style}`}
    >
      {d.label}
    </span>
  );
}

type SortField = "name" | "category" | "brandScore" | "priceTier" | "validationStatus";
type SortDir = "asc" | "desc";

export default function ResultsTable({ places }: ResultsTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | "all">(
    "all"
  );
  const [sortField, setSortField] = useState<SortField>("brandScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = places.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.validationStatus !== statusFilter)
      return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "name":
        return mul * (a.name || "").localeCompare(b.name || "");
      case "category":
        return mul * (a.category || "").localeCompare(b.category || "");
      case "brandScore":
        return mul * ((a.brandScore || 0) - (b.brandScore || 0));
      case "priceTier":
        return mul * (a.priceTier || "").localeCompare(b.priceTier || "");
      case "validationStatus":
        return (
          mul *
          (a.validationStatus || "").localeCompare(b.validationStatus || "")
        );
      default:
        return 0;
    }
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  const categories = [
    ...new Set(places.map((p) => p.category).filter(Boolean)),
  ] as PlaceCategory[];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-stone-100 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-stone-400" />
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as PlaceCategory | "all")
          }
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ValidationStatus | "all")
          }
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="RECOMMENDED">Recommended</option>
          <option value="CONSIDER">Consider</option>
          <option value="REVIEW">Review</option>
          <option value="REJECT">Rejected</option>
        </select>

        <span className="text-xs text-stone-400 ml-auto">
          {sorted.length} of {places.length} places
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th
                className="text-left px-4 py-3 font-semibold text-stone-600 cursor-pointer hover:text-stone-900"
                onClick={() => toggleSort("name")}
              >
                Place Name
                <SortIcon field="name" />
              </th>
              <th
                className="text-left px-4 py-3 font-semibold text-stone-600 cursor-pointer hover:text-stone-900"
                onClick={() => toggleSort("category")}
              >
                Category
                <SortIcon field="category" />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">
                Icons
              </th>
              <th
                className="text-left px-4 py-3 font-semibold text-stone-600 cursor-pointer hover:text-stone-900"
                onClick={() => toggleSort("priceTier")}
              >
                Price
                <SortIcon field="priceTier" />
              </th>
              <th className="text-center px-4 py-3 font-semibold text-stone-600">
                Rating
              </th>
              <th
                className="text-center px-4 py-3 font-semibold text-stone-600 cursor-pointer hover:text-stone-900"
                onClick={() => toggleSort("brandScore")}
              >
                Score
                <SortIcon field="brandScore" />
              </th>
              <th
                className="text-center px-4 py-3 font-semibold text-stone-600 cursor-pointer hover:text-stone-900"
                onClick={() => toggleSort("validationStatus")}
              >
                Status
                <SortIcon field="validationStatus" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((place) => (
              <>
                <tr
                  key={place.id}
                  className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === place.id ? null : place.id || null
                    )
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900">
                        {place.name}
                      </span>
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-stone-400 hover:text-emerald-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {CATEGORY_LABELS[place.category || ""] || place.category}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-base">{place.iconString}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PriceBadge tier={place.priceTier || "FREE"} />
                  </td>
                  <td className="px-4 py-3 text-center text-stone-600">
                    {place.googleRating
                      ? `${place.googleRating} (${place.googleReviewCount})`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        (place.brandScore || 0) >= 80
                          ? "text-emerald-700"
                          : (place.brandScore || 0) >= 60
                            ? "text-amber-700"
                            : (place.brandScore || 0) >= 40
                              ? "text-orange-700"
                              : "text-red-700"
                      }`}
                    >
                      {place.brandScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge
                      status={place.validationStatus || "REVIEW"}
                    />
                  </td>
                </tr>

                {/* Expanded details */}
                {expandedRow === place.id && (
                  <tr
                    key={`${place.id}-detail`}
                    className="bg-stone-50 border-b border-stone-200"
                  >
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-stone-700 mb-1">
                            Location
                          </p>
                          <p className="text-stone-600">
                            {place.address || "—"}
                          </p>
                          <p className="text-stone-600">
                            {place.city}, {place.state} {place.zipCode}
                          </p>
                          {place.phone && (
                            <p className="text-stone-600 mt-1">
                              {place.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-700 mb-1">
                            Description
                          </p>
                          <p className="text-stone-600">
                            {place.shortDescription || "—"}
                          </p>
                          {place.priceDetails && (
                            <p className="text-stone-500 mt-1 text-xs">
                              Pricing: {place.priceDetails}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-700 mb-1">
                            Editorial Notes
                          </p>
                          <p className="text-stone-600">
                            {place.editorialNotes || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="p-8 text-center text-stone-400">
          No places match the current filters.
        </div>
      )}
    </div>
  );
}

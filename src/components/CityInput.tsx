"use client";

import { useState } from "react";
import { MapPin, Sparkles, Loader2 } from "lucide-react";
import { TemplateVersion } from "@/lib/config/weekly-themes";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

interface CityInputProps {
  onGenerate: (city: string, state: string, mode: "demo" | "live", templateVersion: TemplateVersion) => void;
  isLoading: boolean;
}

export default function CityInput({ onGenerate, isLoading }: CityInputProps) {
  const [city, setCity] = useState("Wichita");
  const [state, setState] = useState("KS");
  const [templateVersion, setTemplateVersion] = useState<TemplateVersion>("omaha");

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Generate a New Edition
          </h2>
          <p className="text-sm text-stone-500">
            Enter a U.S. city to research family-friendly places
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Wichita"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              State
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-900 bg-white"
              disabled={isLoading}
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Weekly Theme Template
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["omaha", "lincoln", "des_moines"] as TemplateVersion[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTemplateVersion(v)}
                disabled={isLoading}
                className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  templateVersion === v
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                } disabled:opacity-50`}
              >
                <span className="block font-semibold">
                  {v === "omaha" ? "Version A" : v === "lincoln" ? "Version B" : "Version C"}
                </span>
                <span className="block text-xs mt-0.5 opacity-75">
                  {v === "omaha" ? "Omaha" : v === "lincoln" ? "Lincoln" : "Des Moines"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onGenerate(city, state, "demo", templateVersion)}
            disabled={isLoading || !city.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isLoading ? "Generating..." : "Generate (Demo)"}
          </button>

          <button
            onClick={() => onGenerate(city, state, "live", templateVersion)}
            disabled={isLoading || !city.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-emerald-700 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {isLoading ? "Generating..." : "Generate (AI + Live)"}
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center">
          Demo mode uses sample data. AI + Live mode uses Claude AI for research + Google Places
          for validation.
        </p>
      </div>
    </div>
  );
}

import { DossierGenerator } from "@/components/dossier/dossier-generator";

export default function NewDossierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">
          Generate City Dossier
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          AI-powered research across 10 domains using Gemini with Google Search grounding
        </p>
      </div>
      <DossierGenerator />
    </div>
  );
}

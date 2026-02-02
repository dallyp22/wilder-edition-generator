"use client";

import { DOMAIN_LABELS, DossierDomain, DOSSIER_DOMAINS } from "@/lib/types/dossier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mountain, Bird, TreePine, Wheat, Cloud, MapPin,
  Landmark, Ear, Baby, BookOpen,
} from "lucide-react";

const DOMAIN_ICONS: Record<DossierDomain, React.ElementType> = {
  landscape: Mountain,
  animals: Bird,
  plants: TreePine,
  foodAgriculture: Wheat,
  weather: Cloud,
  localPlaces: MapPin,
  cultureHistory: Landmark,
  sensory: Ear,
  developmental: Baby,
  crossMedia: BookOpen,
};

interface DossierViewerProps {
  dossier: {
    id: string;
    version: number;
    status: string;
    generatedAt: string | null;
    city: { name: string; state: string };
    landscape: unknown;
    animals: unknown;
    plants: unknown;
    foodAgriculture: unknown;
    weather: unknown;
    localPlaces: unknown;
    cultureHistory: unknown;
    sensory: unknown;
    developmental: unknown;
    crossMedia: unknown;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderArray(items: any[] | undefined | null, renderItem: (item: any, i: number) => React.ReactNode) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-stone-400">No data available</p>;
  }
  return <div className="space-y-3">{items.map(renderItem)}</div>;
}

function ItemCard({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div className="p-3 rounded-lg border border-stone-200 bg-white">
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-sm font-semibold text-stone-800">{title}</h4>
        {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
      </div>
      <div className="text-sm text-stone-600">{children}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionGrid({ title, data, renderItem }: { title: string; data: any; renderItem: (item: any, i: number) => React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-stone-800">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderArray(data, renderItem)}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LandscapeContent({ data }: { data: any }) {
  if (!data) return <EmptyDomain />;
  return (
    <div className="space-y-6">
      <SectionGrid title="Dominant Landforms" data={data.dominantLandforms} renderItem={(item, i) => (
        <ItemCard key={i} title={item.type}>
          <p>{item.description}</p>
          {item.whereToSee && <p className="text-xs text-emerald-700 mt-1">See it: {item.whereToSee}</p>}
        </ItemCard>
      )} />
      <SectionGrid title="Natural Features" data={data.signatureNaturalFeatures} renderItem={(item, i) => (
        <ItemCard key={i} title={item.name} badge={item.kidFriendly ? "Kid-friendly" : undefined}>
          <p>{item.significance}</p>
        </ItemCard>
      )} />
      <SectionGrid title="Seasonal Transformations" data={data.seasonalTransformations} renderItem={(item, i) => (
        <ItemCard key={i} title={item.season}>
          <p>{item.description}</p>
          {item.whatKidsNotice && <p className="text-xs text-emerald-700 mt-1">Kids notice: {item.whatKidsNotice}</p>}
        </ItemCard>
      )} />
      <SectionGrid title="Local Ecosystems" data={data.localEcosystems} renderItem={(item, i) => (
        <ItemCard key={i} title={item.name} badge={item.status}>
          {Array.isArray(item.whereToSee) && <p>Where: {item.whereToSee.join(", ")}</p>}
        </ItemCard>
      )} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnimalsContent({ data }: { data: any }) {
  if (!data) return <EmptyDomain />;
  return (
    <div className="space-y-6">
      <SectionGrid title="Iconic Mammals" data={data.iconicMammals} renderItem={(item, i) => (
        <ItemCard key={i} title={item.name} badge={item.kidScore ? `Kid Score: ${item.kidScore}/5` : undefined}>
          <p>{item.funFact}</p>
          {item.whereToSpot && <p className="text-xs text-emerald-700 mt-1">Where: {item.whereToSpot}</p>}
          {item.bestSeason && <p className="text-xs text-stone-500">Best: {item.bestSeason}</p>}
        </ItemCard>
      )} />
      <SectionGrid title="Common Birds" data={data.commonBirds} renderItem={(item, i) => (
        <ItemCard key={i} title={item.name} badge={item.isStateBird ? "State Bird" : undefined}>
          <p>{item.distinctiveFeature}</p>
          {item.sound && <p className="text-xs text-stone-500">Sound: {item.sound}</p>}
        </ItemCard>
      )} />
      <SectionGrid title="Insects & Pollinators" data={data.insectsAndPollinators} renderItem={(item, i) => (
        <ItemCard key={i} title={item.name} badge={item.bestSeason}>
          <p>{item.whereToObserve}</p>
        </ItemCard>
      )} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GenericContent({ data }: { data: any }) {
  if (!data) return <EmptyDomain />;

  // Render each top-level key as a section
  return (
    <div className="space-y-6">
      {Object.entries(data).map(([key, value]) => {
        const title = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

        if (Array.isArray(value)) {
          return (
            <div key={key} className="space-y-3">
              <h3 className="text-base font-semibold text-stone-800">{title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(value as Record<string, unknown>[]).map((item, i) => {
                  const itemTitle = (item.name || item.title || item.crop || item.food ||
                    item.craft || item.song || item.concept || item.place ||
                    item.sound || item.smell || item.texture || item.phenomenon ||
                    item.season || item.tradition || item.animal || item.material ||
                    item.plant || item.setting || item.feature || item.mode ||
                    item.story || item.hazard || item.localElement || item.age ||
                    `Item ${i + 1}`) as string;

                  const description = (item.description || item.significance ||
                    item.funFact || item.whereToSee || item.howItHelps ||
                    item.connection || item.observation || item.whatKidsNotice ||
                    item.activityPairing || item.emotionalResonance ||
                    item.explorationIdea || item.simpleExplanation ||
                    item.homeActivity || item.readAloudTip || "") as string;

                  return (
                    <ItemCard key={i} title={itemTitle}>
                      {description && <p>{description}</p>}
                    </ItemCard>
                  );
                })}
              </div>
            </div>
          );
        }

        if (typeof value === "object" && value !== null) {
          return (
            <div key={key} className="space-y-3">
              <h3 className="text-base font-semibold text-stone-800">{title}</h3>
              <div className="p-3 rounded-lg border border-stone-200 bg-white">
                {Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) => (
                  <div key={subKey} className="mb-2">
                    <span className="text-xs font-medium text-stone-500">
                      {subKey.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}:
                    </span>
                    <span className="text-sm text-stone-700 ml-2">
                      {Array.isArray(subVal) ? subVal.join(", ") : String(subVal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function EmptyDomain() {
  return (
    <div className="text-center py-12">
      <p className="text-stone-400 text-sm">
        This domain hasn&apos;t been researched yet.
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOMAIN_RENDERERS: Partial<Record<DossierDomain, React.FC<{ data: any }>>> = {
  landscape: LandscapeContent,
  animals: AnimalsContent,
};

export function DossierViewer({ dossier }: DossierViewerProps) {
  return (
    <Tabs defaultValue="landscape" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-stone-100 p-1">
        {DOSSIER_DOMAINS.map((domain) => {
          const Icon = DOMAIN_ICONS[domain];
          const hasData = !!dossier[domain as keyof typeof dossier];
          return (
            <TabsTrigger
              key={domain}
              value={domain}
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white"
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{DOMAIN_LABELS[domain]}</span>
              {!hasData && <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {DOSSIER_DOMAINS.map((domain) => {
        const data = dossier[domain as keyof typeof dossier];
        const Renderer = DOMAIN_RENDERERS[domain] || GenericContent;

        return (
          <TabsContent key={domain} value={domain}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => { const Icon = DOMAIN_ICONS[domain]; return <Icon className="w-5 h-5 text-emerald-600" />; })()}
                  {DOMAIN_LABELS[domain]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Renderer data={data} />
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

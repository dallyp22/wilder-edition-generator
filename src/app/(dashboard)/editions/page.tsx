import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EditionsPage() {
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

      <Card>
        <CardHeader className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-stone-400" />
          </div>
          <CardTitle className="text-stone-700">No editions yet</CardTitle>
          <CardDescription>
            Generate your first edition to see it listed here.
            Edition history will be saved once the database is connected.
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
    </div>
  );
}

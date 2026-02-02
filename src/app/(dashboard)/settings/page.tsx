import { Settings } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Settings</h2>
        <p className="text-stone-500 text-sm mt-1">
          Platform configuration and preferences
        </p>
      </div>

      <Card>
        <CardHeader className="text-center py-16">
          <div className="mx-auto w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-stone-400" />
          </div>
          <CardTitle className="text-stone-700">Settings</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Team management, API key configuration, notification preferences,
            and platform settings will be available here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

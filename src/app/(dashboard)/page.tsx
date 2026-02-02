import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Globe, Kanban, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function DashboardHome() {
  const user = await currentUser();

  const quickActions = [
    {
      label: "New Edition",
      href: "/editions/new",
      icon: BookOpen,
      description: "Generate a city edition with AI-powered discovery",
    },
    {
      label: "City Dossiers",
      href: "/dossiers",
      icon: Globe,
      description: "10-domain city research (coming soon)",
    },
    {
      label: "Projects",
      href: "/projects",
      icon: Kanban,
      description: "Track edition pipeline (coming soon)",
    },
    {
      label: "Finance",
      href: "/finance",
      icon: DollarSign,
      description: "Revenue and unit tracking (coming soon)",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Welcome back, {user?.firstName || "there"}
        </h1>
        <p className="text-stone-500 mt-1">Wilder Seasons Operating System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-emerald-300 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-emerald-700" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  {action.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-stone-500">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  BookOpen,
  Globe,
  Kanban,
  DollarSign,
  Settings,
  Leaf,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Editions", href: "/editions", icon: BookOpen },
  { label: "Dossiers", href: "/dossiers", icon: Globe },
  { label: "Projects", href: "/projects", icon: Kanban },
  { label: "Finance", href: "/finance", icon: DollarSign },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface DashboardShellProps {
  userName: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userName, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-stone-200 flex flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 bg-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-stone-900">
                Wilder Seasons
              </h1>
              <p className="text-xs text-stone-500">Operating System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive && "text-emerald-700"
                  )}
                />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-stone-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">
              {userName || "Team Member"}
            </span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-stone-50">{children}</main>
      </div>
    </div>
  );
}

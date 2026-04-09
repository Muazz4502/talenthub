"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  Share2,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Interviews", href: "/interviews", icon: Calendar },
  { label: "Feedback", href: "/feedback", icon: MessageSquare },
  { label: "Referrals", href: "/referrals", icon: Share2 },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

interface SidebarProps {
  userRole: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function Sidebar({ userRole, userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">TalentHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="h-7 w-7">
            {userImage && <AvatarImage src={userImage} alt={userName ?? ""} />}
            <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{userName ?? "User"}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail ?? ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

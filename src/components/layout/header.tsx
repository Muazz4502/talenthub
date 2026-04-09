"use client";

import { Bell, LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface HeaderProps {
  title: string;
  userName?: string | null;
  userImage?: string | null;
  userRole?: string;
}

export function Header({ title, userName, userImage, userRole }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-gray-500" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                {userImage && <AvatarImage src={userImage} alt={userName ?? ""} />}
                <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{userName ?? "User"}</p>
                <p className="text-xs text-gray-500 font-normal">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </a>
            </DropdownMenuItem>
            {userRole === "ADMIN" && (
              <DropdownMenuItem asChild>
                <a href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

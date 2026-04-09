"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: Date;
}

const ROLES = ["ADMIN", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "EMPLOYEE"] as const;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "destructive",
  RECRUITER: "info",
  HIRING_MANAGER: "warning",
  INTERVIEWER: "secondary",
  EMPLOYEE: "outline",
};

export function UserRoleManager({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: string) => {
    if (userId === currentUserId) {
      toast({ title: "You cannot change your own role", variant: "destructive" });
      return;
    }

    setUpdating(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: `Role updated to ${role}`, variant: "default" as any });
      router.refresh();
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to update role", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="divide-y divide-gray-100">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-4 px-4 py-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{getInitials(user.name ?? user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name ?? "—"}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <p className="text-xs text-gray-400 hidden md:block shrink-0">
            Joined {formatDate(user.createdAt)}
          </p>
          <div className="shrink-0">
            {user.id === currentUserId ? (
              <Badge variant={ROLE_COLORS[user.role] as any}>{user.role}</Badge>
            ) : (
              <Select
                value={user.role}
                onValueChange={(v) => handleRoleChange(user.id, v)}
                disabled={updating === user.id}
              >
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

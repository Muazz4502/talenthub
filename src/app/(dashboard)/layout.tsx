import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />
      <div className="flex-1 flex flex-col overflow-hidden ml-60">
        <Header
          title="TalentHub"
          userName={session.user.name}
          userImage={session.user.image}
          userRole={session.user.role}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

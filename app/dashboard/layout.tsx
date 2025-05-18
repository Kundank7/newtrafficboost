import type React from "react"
import { UserSidebar } from "@/components/layout/user-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
    </div>
  )
}

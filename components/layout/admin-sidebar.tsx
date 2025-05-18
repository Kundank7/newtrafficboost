"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, ShoppingCart, Settings, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useState } from "react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin-access/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin-access/users",
    color: "text-violet-500",
  },
  {
    label: "Deposits",
    icon: CreditCard,
    href: "/admin-access/deposits",
    color: "text-pink-700",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/admin-access/orders",
    color: "text-orange-500",
  },
  {
    label: "Services",
    icon: Settings,
    href: "/admin-access/services",
    color: "text-emerald-500",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/admin-access")
    router.refresh()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
            <div className="px-3 py-2 flex-1">
              <Link href="/admin-access/dashboard" className="flex items-center pl-3 mb-14">
                <h1 className="text-xl font-bold">Admin Panel</h1>
              </Link>
              <div className="space-y-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                      pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                    )}
                  >
                    <div className="flex items-center flex-1">
                      <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                      {route.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-3 text-red-500" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="hidden md:flex h-full w-72 flex-col bg-slate-900 text-white">
        <div className="px-3 py-4 flex-1">
          <Link href="/admin-access/dashboard" className="flex items-center pl-3 mb-14">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </Link>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                  pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="px-3 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3 text-red-500" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}

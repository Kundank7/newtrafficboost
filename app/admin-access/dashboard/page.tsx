import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/admin-access")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/admin-access")
  }

  // Get counts for dashboard
  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: pendingDepositsCount } = await supabase
    .from("deposits")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: activeOrdersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "processing", "running"])

  const { count: servicesCount } = await supabase.from("services").select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
            <CardDescription>Registered user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{usersCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Deposits</CardTitle>
            <CardDescription>Deposits awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingDepositsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Orders</CardTitle>
            <CardDescription>Orders in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeOrdersCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Services</CardTitle>
            <CardDescription>Available traffic services</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{servicesCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Panel Overview</CardTitle>
          <CardDescription>
            Welcome to the admin panel. Here you can manage users, deposits, orders, and services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Users Management</h3>
              <p className="text-sm text-muted-foreground">View all users and manage their balances.</p>
            </div>

            <div>
              <h3 className="font-medium">Deposits Management</h3>
              <p className="text-sm text-muted-foreground">
                Review deposit requests, view payment screenshots, and approve or reject deposits.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Orders Management</h3>
              <p className="text-sm text-muted-foreground">View all orders and update their status as they progress.</p>
            </div>

            <div>
              <h3 className="font-medium">Services Management</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or remove traffic services and set their pricing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

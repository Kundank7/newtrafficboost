import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CreditCard, ShoppingCart, Clock } from "lucide-react"

export default async function Dashboard() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: deposits, error: depositsError } = await supabase
    .from("deposits")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <BalanceCard balance={profile?.balance || 0} email={profile?.email || session.user.email || ""} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/deposit">
                <CreditCard className="mr-2 h-4 w-4" />
                Make a Deposit
              </Link>
            </Button>
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/order">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Order Traffic
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/history">
                <Clock className="mr-2 h-4 w-4" />
                View Order History
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your recent orders and deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Recent Orders</h3>
                {orders && orders.length > 0 ? (
                  <ul className="space-y-1">
                    {orders.map((order) => (
                      <li key={order.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}:
                        </span>{" "}
                        Order #{order.id} - {order.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent orders</p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Deposits</h3>
                {deposits && deposits.length > 0 ? (
                  <ul className="space-y-1">
                    {deposits.map((deposit) => (
                      <li key={deposit.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {new Date(deposit.created_at).toLocaleDateString()}:
                        </span>{" "}
                        Deposit #{deposit.id} - {deposit.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent deposits</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface Order {
  id: number
  user_id: string
  user_email: string
  service: {
    id: number
    name: string
    type: string
  }
  quantity: number
  total_amount: number
  status: "pending" | "processing" | "running" | "completed" | "cancelled"
  created_at: string
}

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // First get all orders with service details
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            id,
            user_id,
            quantity,
            total_amount,
            status,
            created_at,
            service:service_id (
              id,
              name,
              type
            )
          `)
          .order("created_at", { ascending: false })

        if (ordersError) {
          throw ordersError
        }

        // Get user emails for each order
        const ordersWithUserEmails = await Promise.all(
          (ordersData || []).map(async (order) => {
            const { data: userData, error: userError } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", order.user_id)
              .single()

            if (userError) {
              console.error(`Error fetching user email for order ${order.id}:`, userError)
              return { ...order, user_email: "Unknown" }
            }

            return { ...order, user_email: userData?.email || "Unknown" }
          }),
        )

        setOrders(ordersWithUserEmails)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load orders. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [supabase, toast])

  const handleStatusChange = async (orderId: number, status: Order["status"]) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) {
        throw error
      }

      // Update local state
      setOrders(
        orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, status }
          }
          return order
        }),
      )

      toast({
        title: "Order Updated",
        description: `Order #${orderId} status has been updated to ${status}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <CardDescription>Manage and update order statuses</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders Management</CardTitle>
        <CardDescription>Manage and update order statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Service</th>
                  <th className="text-left py-3 px-2">Quantity</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 px-2">{order.id}</td>
                    <td className="py-3 px-2">{order.user_email}</td>
                    <td className="py-3 px-2">{order.service?.name || "Unknown"}</td>
                    <td className="py-3 px-2">{order.quantity}</td>
                    <td className="py-3 px-2">{formatCurrency(order.total_amount)}</td>
                    <td className="py-3 px-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-2">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-2">
                      <Select
                        defaultValue={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as Order["status"])}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

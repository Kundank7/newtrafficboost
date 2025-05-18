"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Loader2, Eye, Check, X } from "lucide-react"

interface Deposit {
  id: number
  user_id: string
  name: string
  email: string
  message: string | null
  screenshot_url: string | null
  method: string
  amount: number
  status: string
  created_at: string
}

export function DepositsTable() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setDeposits(data || [])
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load deposits. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDeposits()
  }, [supabase, toast])

  const handleViewDeposit = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDialogOpen(true)
  }

  const handleUpdateStatus = async (depositId: number, status: "completed" | "rejected") => {
    try {
      // First update the deposit status
      const { error: depositError } = await supabase.from("deposits").update({ status }).eq("id", depositId)

      if (depositError) {
        throw depositError
      }

      // If completing the deposit, add the amount to the user's balance
      if (status === "completed") {
        const deposit = deposits.find((d) => d.id === depositId)

        if (deposit) {
          // Get current balance
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("balance")
            .eq("id", deposit.user_id)
            .single()

          if (userError) {
            throw userError
          }

          const currentBalance = userData?.balance || 0
          const newBalance = currentBalance + deposit.amount

          // Update balance
          const { error: balanceError } = await supabase
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", deposit.user_id)

          if (balanceError) {
            throw balanceError
          }
        }
      }

      // Update local state
      setDeposits(
        deposits.map((d) => {
          if (d.id === depositId) {
            return { ...d, status }
          }
          return d
        }),
      )

      toast({
        title: "Deposit Updated",
        description: `Deposit has been marked as ${status}.`,
      })

      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update deposit status. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deposits Management</CardTitle>
          <CardDescription>Review and manage deposit requests</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Deposits Management</CardTitle>
          <CardDescription>Review and manage deposit requests</CardDescription>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No deposits found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Method</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b">
                      <td className="py-3 px-2">{deposit.id}</td>
                      <td className="py-3 px-2">{deposit.name}</td>
                      <td className="py-3 px-2">{deposit.email}</td>
                      <td className="py-3 px-2">{deposit.method.toUpperCase()}</td>
                      <td className="py-3 px-2">{formatCurrency(deposit.amount)}</td>
                      <td className="py-3 px-2">
                        <StatusBadge status={deposit.status} />
                      </td>
                      <td className="py-3 px-2">{formatDate(deposit.created_at)}</td>
                      <td className="py-3 px-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDeposit(deposit)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm">{selectedDeposit.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm">{selectedDeposit.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Method</p>
                  <p className="text-sm">{selectedDeposit.method.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm">{formatCurrency(selectedDeposit.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm">
                    <StatusBadge status={selectedDeposit.status} />
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{formatDate(selectedDeposit.created_at)}</p>
                </div>
              </div>

              {selectedDeposit.message && (
                <div>
                  <p className="text-sm font-medium">Message</p>
                  <p className="text-sm">{selectedDeposit.message}</p>
                </div>
              )}

              {selectedDeposit.screenshot_url && (
                <div>
                  <p className="text-sm font-medium">Payment Screenshot</p>
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <img
                      src={selectedDeposit.screenshot_url || "/placeholder.svg"}
                      alt="Payment Screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {selectedDeposit.status === "pending" && (
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => handleUpdateStatus(selectedDeposit.id, "rejected")}>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={() => handleUpdateStatus(selectedDeposit.id, "completed")}>
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

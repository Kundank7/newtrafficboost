"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Loader2, Edit, Check, X } from "lucide-react"

interface User {
  id: string
  email: string
  balance: number
  role: string
  created_at: string
  isEditing?: boolean
  newBalance?: number
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setUsers(data || [])
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [supabase, toast])

  const handleEditBalance = (userId: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          return { ...user, isEditing: true, newBalance: user.balance / 100 }
        }
        return user
      }),
    )
  }

  const handleCancelEdit = (userId: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          return { ...user, isEditing: false, newBalance: undefined }
        }
        return user
      }),
    )
  }

  const handleBalanceChange = (userId: string, value: string) => {
    const numValue = Number.parseFloat(value)
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          return { ...user, newBalance: isNaN(numValue) ? 0 : numValue }
        }
        return user
      }),
    )
  }

  const handleSaveBalance = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user || user.newBalance === undefined) return

    try {
      const newBalanceCents = Math.round(user.newBalance * 100)

      const { error } = await supabase.from("profiles").update({ balance: newBalanceCents }).eq("id", userId)

      if (error) {
        throw error
      }

      setUsers(
        users.map((u) => {
          if (u.id === userId) {
            return { ...u, balance: newBalanceCents, isEditing: false, newBalance: undefined }
          }
          return u
        }),
      )

      toast({
        title: "Balance Updated",
        description: `Balance for ${user.email} has been updated.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update balance. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>Manage user accounts and balances</CardDescription>
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
        <CardTitle>Users Management</CardTitle>
        <CardDescription>Manage user accounts and balances</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-left py-3 px-2">Balance</th>
                  <th className="text-left py-3 px-2">Created</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3 px-2">{user.email}</td>
                    <td className="py-3 px-2">{user.role}</td>
                    <td className="py-3 px-2">
                      {user.isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={user.newBalance}
                            onChange={(e) => handleBalanceChange(user.id, e.target.value)}
                            className="w-24 h-8"
                            step="0.01"
                          />
                          <span className="text-sm text-muted-foreground">USD</span>
                        </div>
                      ) : (
                        formatCurrency(user.balance)
                      )}
                    </td>
                    <td className="py-3 px-2">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-2">
                      {user.isEditing ? (
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleSaveBalance(user.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCancelEdit(user.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleEditBalance(user.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
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

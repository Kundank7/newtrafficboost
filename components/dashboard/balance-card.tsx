"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface BalanceCardProps {
  balance: number
  email: string
}

export function BalanceCard({ balance, email }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">Your Balance</CardTitle>
        <CardDescription>Welcome, {email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
      </CardContent>
    </Card>
  )
}

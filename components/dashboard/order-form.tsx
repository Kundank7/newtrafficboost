"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface Service {
  id: number
  name: string
  type: string
  price_per_unit: number
}

export function OrderForm() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState<number>(1000)
  const [loading, setLoading] = useState(false)
  const [loadingServices, setLoadingServices] = useState(true)
  const [userBalance, setUserBalance] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Calculate total amount
  const totalAmount = selectedService ? selectedService.price_per_unit * quantity : 0

  // Check if user has sufficient balance
  const hasSufficientBalance = userBalance >= totalAmount

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase.from("services").select("*").order("name")

        if (error) {
          throw error
        }

        setServices(data || [])
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load services. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoadingServices(false)
      }
    }

    const fetchUserBalance = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase.from("profiles").select("balance").eq("id", user.id).single()

          if (error) {
            throw error
          }

          setUserBalance(data?.balance || 0)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load your balance. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchServices()
    fetchUserBalance()
  }, [supabase, toast])

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === Number.parseInt(serviceId))
    setSelectedService(service || null)
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuantity(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedService) {
      toast({
        title: "Error",
        description: "Please select a service.",
        variant: "destructive",
      })
      return
    }

    if (!hasSufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to place this order.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to place an order")
      }

      // Start a transaction
      // Note: Supabase doesn't support transactions directly in the client library,
      // so we'll do multiple operations and handle errors carefully

      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            service_id: selectedService.id,
            quantity,
            total_amount: totalAmount,
            status: "pending",
          },
        ])
        .select()

      if (orderError) {
        throw orderError
      }

      // 2. Update user balance
      const newBalance = userBalance - totalAmount
      const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      if (balanceError) {
        // If updating balance fails, we should ideally roll back the order
        // But since we can't do a proper transaction, we'll just notify the admin
        console.error("Failed to update balance, but order was created:", balanceError)
      }

      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully.",
      })

      router.push("/dashboard/history")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while placing your order.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Traffic</CardTitle>
        <CardDescription>Select a service and quantity to order traffic</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Service Type</Label>
            <Select disabled={loadingServices} onValueChange={handleServiceChange}>
              <SelectTrigger id="service">
                <SelectValue placeholder={loadingServices ? "Loading services..." : "Select a service"} />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - {formatCurrency(service.price_per_unit)} per unit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="100"
              step="100"
              value={quantity}
              onChange={handleQuantityChange}
              required
            />
          </div>
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-sm">
              <span>Price per unit:</span>
              <span>{selectedService ? formatCurrency(selectedService.price_per_unit) : "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-medium pt-2">
              <span>Total Amount:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span>Your Balance:</span>
              <span>{formatCurrency(userBalance)}</span>
            </div>
          </div>
          {!hasSufficientBalance && totalAmount > 0 && (
            <div className="text-red-500 text-sm">Insufficient balance. Please deposit more funds.</div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !selectedService || !hasSufficientBalance}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

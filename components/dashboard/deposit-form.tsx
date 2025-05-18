"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function DepositForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [method, setMethod] = useState<"upi" | "crypto">("upi")
  const [amount, setAmount] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [allowNoScreenshot, setAllowNoScreenshot] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to make a deposit")
      }

      let screenshotUrl = null

      // Upload screenshot if provided
      if (file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `deposits/${fileName}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("screenshots")
          .upload(filePath, file)

        if (uploadError) {
          // Check if it's a bucket not found error
          if (uploadError.message && uploadError.message.includes("bucket not found")) {
            throw new Error("Storage bucket 'screenshots' not found. Please create it in your Supabase project.")
          }
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("screenshots").getPublicUrl(filePath)

        screenshotUrl = urlData.publicUrl
      }

      // Create deposit record
      const { error: depositError } = await supabase.from("deposits").insert([
        {
          user_id: user.id,
          name,
          email,
          message,
          method,
          amount: Number.parseInt(amount) * 100, // Convert to cents
          screenshot_url: screenshotUrl,
        },
      ])

      if (depositError) {
        throw depositError
      }

      toast({
        title: "Deposit Submitted",
        description: "Your deposit request has been submitted for review.",
      })

      setSubmitted(true)
    } catch (error: any) {
      // Check if it's a bucket not found error
      if (error.message && (error.message.includes("bucket not found") || error.message.includes("Storage bucket"))) {
        setAllowNoScreenshot(true)
        toast({
          title: "Storage Error",
          description:
            "There was an issue with file storage. You can continue without uploading a screenshot, or contact support.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred while submitting your deposit.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Under Review</CardTitle>
          <CardDescription>Your deposit request has been submitted and is being reviewed by our team.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>We will process your deposit as soon as possible.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a Deposit</CardTitle>
        <CardDescription>Add funds to your account to order traffic</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <RadioGroup
              id="payment-method"
              value={method}
              onValueChange={(value) => setMethod(value as "upi" | "crypto")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi">UPI/QR</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto">Cryptocurrency</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any additional information"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenshot">Payment Screenshot</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required={!allowNoScreenshot}
            />
            {allowNoScreenshot && (
              <p className="text-sm text-amber-600">
                File storage is currently unavailable. You may continue without a screenshot, but approval may be
                delayed.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Deposit"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

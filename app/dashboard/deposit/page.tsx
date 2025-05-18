import { DepositForm } from "@/components/dashboard/deposit-form"

export default function DepositPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Make a Deposit</h1>
      <DepositForm />
    </div>
  )
}

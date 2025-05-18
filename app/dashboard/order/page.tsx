import { OrderForm } from "@/components/dashboard/order-form"

export default function OrderPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Order Traffic</h1>
      <OrderForm />
    </div>
  )
}

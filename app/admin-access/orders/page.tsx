import { OrdersTable } from "@/components/admin/orders-table"

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders Management</h1>
      <OrdersTable />
    </div>
  )
}

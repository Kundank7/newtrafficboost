import { DepositsTable } from "@/components/admin/deposits-table"

export default function DepositsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Deposits Management</h1>
      <DepositsTable />
    </div>
  )
}

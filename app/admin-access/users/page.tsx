import { UsersTable } from "@/components/admin/users-table"

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users Management</h1>
      <UsersTable />
    </div>
  )
}

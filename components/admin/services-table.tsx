"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Loader2, Plus, Edit, Trash } from "lucide-react"

interface Service {
  id: number
  name: string
  type: "country" | "device" | "worldwide" | "mixed"
  price_per_unit: number
  created_at: string
}

export function ServicesTable() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "country" as Service["type"],
    price: "",
  })
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchServices()
  }, [])

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
        description: error.message || "Failed to load services. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = () => {
    setSelectedService(null)
    setFormData({
      name: "",
      type: "country",
      price: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setFormData({
      name: service.name,
      type: service.type,
      price: (service.price_per_unit / 100).toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDeleteService = (service: Service) => {
    setSelectedService(service)
    setIsDeleteDialogOpen(true)
  }

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = async () => {
    try {
      const price_per_unit = Math.round(Number.parseFloat(formData.price) * 100)

      if (isNaN(price_per_unit) || price_per_unit <= 0) {
        throw new Error("Please enter a valid price")
      }

      if (!formData.name.trim()) {
        throw new Error("Please enter a service name")
      }

      if (selectedService) {
        // Update existing service
        const { error } = await supabase
          .from("services")
          .update({
            name: formData.name,
            type: formData.type,
            price_per_unit,
          })
          .eq("id", selectedService.id)

        if (error) {
          throw error
        }

        toast({
          title: "Service Updated",
          description: `${formData.name} has been updated.`,
        })
      } else {
        // Add new service
        const { error } = await supabase.from("services").insert([
          {
            name: formData.name,
            type: formData.type,
            price_per_unit,
          },
        ])

        if (error) {
          throw error
        }

        toast({
          title: "Service Added",
          description: `${formData.name} has been added.`,
        })
      }

      setIsDialogOpen(false)
      fetchServices()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedService) return

    try {
      const { error } = await supabase.from("services").delete().eq("id", selectedService.id)

      if (error) {
        throw error
      }

      toast({
        title: "Service Deleted",
        description: `${selectedService.name} has been deleted.`,
      })

      setIsDeleteDialogOpen(false)
      fetchServices()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services Management</CardTitle>
          <CardDescription>Manage traffic services and pricing</CardDescription>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Services Management</CardTitle>
            <CardDescription>Manage traffic services and pricing</CardDescription>
          </div>
          <Button onClick={handleAddService}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No services found. Add your first service to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-left py-3 px-2">Price Per Unit</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b">
                      <td className="py-3 px-2">{service.name}</td>
                      <td className="py-3 px-2 capitalize">{service.type}</td>
                      <td className="py-3 px-2">{formatCurrency(service.price_per_unit)}</td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedService ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Service Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="e.g., USA Traffic"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Service Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleFormChange("type", value as Service["type"])}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="country">Country Targeted</SelectItem>
                  <SelectItem value="device">Device Targeted</SelectItem>
                  <SelectItem value="worldwide">Worldwide</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price Per Unit (USD)
              </label>
              <Input
                id="price"
                type="number"
                step="0.0005"
                min="0.0005"
                value={formData.price}
                onChange={(e) => handleFormChange("price", e.target.value)}
                placeholder="e.g., 0.0005"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{selectedService ? "Update" : "Add"} Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete <strong>{selectedService?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

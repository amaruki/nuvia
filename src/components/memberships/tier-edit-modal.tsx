"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MembershipTier } from "@/types/membership.types"
import {
  Plus,
  Trash2,
  Crown,
  Star,
  Shield,
  Zap,
  Diamond,
  Gem
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"

interface TierEditModalProps {
  tier: {
    tier: MembershipTier
    name: string
    description: string
    price: string
    period: string
    features: string[]
    benefits: string[]
    memberCount: number
    status: "active" | "inactive" | "popular"
    icon: React.ReactNode
    color: string
    visibility?: boolean
    upgradeFrom?: string[]
    upgradeTo?: string[]
    restrictions?: string[]
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tier: any) => void
}

const tierIcons = {
  [MembershipTier.BASIC]: Shield,
  [MembershipTier.STUDENT]: Star,
  [MembershipTier.PROFESSIONAL]: Zap,
  [MembershipTier.CORPORATE]: Crown,
  [MembershipTier.VIP]: Diamond,
  [MembershipTier.PREMIUM]: Gem,
}

export function TierEditModal({ tier, open, onOpenChange, onSave }: TierEditModalProps) {
  const [formData, setFormData] = useState({
    name: tier?.name || "",
    description: tier?.description || "",
    price: tier?.price || "",
    period: tier?.period || "month",
    status: tier?.status || "active",
    color: tier?.color || "blue",
    visibility: tier?.visibility ?? true,
    features: tier?.features || [],
    benefits: tier?.benefits || [],
    upgradeFrom: tier?.upgradeFrom || [],
    upgradeTo: tier?.upgradeTo || [],
    restrictions: tier?.restrictions || []
  })

  const [newFeature, setNewFeature] = useState("")

  if (!tier) return null

  const handleSave = () => {
    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Tier name is required")
      return
    }

    if (!formData.price.trim()) {
      toast.error("Price is required")
      return
    }

    if (!formData.description.trim()) {
      toast.error("Description is required")
      return
    }

    onSave({
      ...tier,
      ...formData
    })
    onOpenChange(false)
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const removeBenefit = (index: number) => {
    const benefitIndex = index - formData.features.length
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== benefitIndex)
    }))
  }

  
  const Icon = tierIcons[tier.tier]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Edit {tier.name}</DialogTitle>
              <DialogDescription>
                Configure membership tier settings
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tier Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Professional Member"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this membership tier..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="$29"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Billing Period</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                        <SelectItem value="quarter">Quarterly</SelectItem>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Theme Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem>
                        <SelectItem value="indigo">Indigo</SelectItem>
                        <SelectItem value="rose">Rose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="visibility"
                        checked={formData.visibility}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visibility: checked as boolean }))}
                      />
                      <Label htmlFor="visibility">Visible to users</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label>Features & Benefits</Label>
                  <p className="text-sm text-muted-foreground">Add features and benefits for this membership tier</p>
                </div>

                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature or benefit..."
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={addFeature} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...formData.features, ...formData.benefits].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 border rounded"
                    >
                      <span className="flex-1 text-sm">{item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (index < formData.features.length) {
                            removeFeature(index)
                          } else {
                            removeBenefit(index)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {formData.features.length === 0 && formData.benefits.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No features or benefits added yet</p>
                  </div>
                )}
              </TabsContent>

  
              <TabsContent value="advanced" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="visibility"
                          checked={formData.visibility}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visibility: checked as boolean }))}
                        />
                        <Label htmlFor="visibility">Visible to users</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Upgrade Path</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select upgrade path..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">From Basic</SelectItem>
                          <SelectItem value="professional">To Professional</SelectItem>
                          <SelectItem value="corporate">To Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
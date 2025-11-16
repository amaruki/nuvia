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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembershipTier } from "@/types/membership.types"
import {
  CheckCircle2,
  Star
} from "lucide-react"

interface TierDetailModalProps {
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
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}


export function TierDetailModal({ tier, open, onOpenChange }: TierDetailModalProps) {
  if (!tier) return null

  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{tier.name}</DialogTitle>
          <DialogDescription>
            {tier.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Price</h3>
                <p className="text-lg font-semibold">{tier.price}/{tier.period}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                <Badge variant={tier.status === "active" ? "default" : "secondary"}>
                  {tier.status}
                </Badge>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Members</h3>
                <p className="text-lg font-semibold">{tier.memberCount.toLocaleString()}</p>
              </div>
              </div>

            {/* Description */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{tier.description}</p>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="font-medium">Features & Benefits</h3>
            </div>

            <div className="space-y-2">
              {[...tier.features, ...tier.benefits].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 border rounded-lg"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            {tier.features.length === 0 && tier.benefits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No features or benefits configured yet</p>
              </div>
            )}
          </TabsContent>

          </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
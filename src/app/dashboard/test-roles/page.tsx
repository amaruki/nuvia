// "use client"

// import * as React from "react"
// import DashboardLayout from "../../layout"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { UserRole } from "@/types/dashboard.types"

// const mockUser = {
//   name: "John Doe",
//   email: "john.doe@example.com",
//   avatar: "", // URL to avatar image
// }

// export default function TestRolesPage() {
//   const [currentRole, setCurrentRole] = React.useState<UserRole>("member")

//   const roleDescriptions = {
//     member: "Regular community member with access to basic features",
//     admin: "Administrator with full access to all platform features",
//     moderator: "Moderator with access to content management features"
//   }

//   const roleFeatures = {
//     member: [
//       "Dashboard",
//       "Community",
//       "Events",
//       "Articles",
//       "Discussions",
//       "Certificates",
//       "Profile",
//       "Notifications",
//       "Active Devices",
//       "Login Activities",
//       "Settings"
//     ],
//     moderator: [
//       "Dashboard",
//       "Community",
//       "Events",
//       "Articles",
//       "Discussions",
//       "Certificates",
//       "Profile",
//       "Notifications",
//       "Active Devices",
//       "Login Activities",
//       "Moderation",
//       "Settings"
//     ],
//     admin: [
//       "Dashboard",
//       "Community",
//       "Events",
//       "Articles",
//       "Discussions",
//       "Certificates",
//       "Profile",
//       "Notifications",
//       "Active Devices",
//       "Login Activities",
//       "Moderation",
//       "Finance",
//       "Analytics",
//       "Settings"
//     ]
//   }

//   return (
//     <DashboardLayout
//       user={mockUser}
//       role={currentRole}
//       headerProps={{
//         title: "Role Testing",
//         description: "Test the sidebar navigation with different user roles"
//       }}
//     >
//       <div className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center justify-between">
//               User Role Testing
//               <Badge variant={currentRole === "admin" ? "destructive" : currentRole === "moderator" ? "secondary" : "default"}>
//                 {currentRole}
//               </Badge>
//             </CardTitle>
//             <CardDescription>
//               Switch between different user roles to see how the sidebar navigation adapts
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-wrap gap-3 mb-6">
//               <Button
//                 variant={currentRole === "member" ? "default" : "outline"}
//                 onClick={() => setCurrentRole("member")}
//               >
//                 Member Role
//               </Button>
//               <Button
//                 variant={currentRole === "moderator" ? "default" : "outline"}
//                 onClick={() => setCurrentRole("moderator")}
//               >
//                 Moderator Role
//               </Button>
//               <Button
//                 variant={currentRole === "admin" ? "default" : "outline"}
//                 onClick={() => setCurrentRole("admin")}
//               >
//                 Admin Role
//               </Button>
//             </div>
            
//             <div className="space-y-4">
//               <div>
//                 <h3 className="text-lg font-semibold mb-2">Current Role: {currentRole}</h3>
//                 <p className="text-muted-foreground">{roleDescriptions[currentRole]}</p>
//               </div>
              
//               <div>
//                 <h4 className="font-medium mb-2">Available Navigation Items:</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
//                   {roleFeatures[currentRole].map((feature) => (
//                     <div key={feature} className="flex items-center p-2 bg-muted rounded-md">
//                       <span className="text-sm">{feature}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Testing Instructions</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div>
//               <h4 className="font-medium mb-2">Desktop Testing:</h4>
//               <ul className="list-disc pl-5 space-y-1 text-sm">
//                 <li>Switch between roles using the buttons above</li>
//                 <li>Observe how the sidebar navigation items change based on the selected role</li>
//                 <li>Test the collapse/expand functionality of the sidebar</li>
//                 <li>Verify that role-specific items (Moderation, Finance, Analytics) appear/disappear appropriately</li>
//               </ul>
//             </div>
            
//             <div>
//               <h4 className="font-medium mb-2">Mobile Testing:</h4>
//               <ul className="list-disc pl-5 space-y-1 text-sm">
//                 <li>Resize your browser window to mobile width</li>
//                 <li>Test the hamburger menu functionality</li>
//                 <li>Verify that the mobile sidebar opens and closes properly</li>
//                 <li>Check that navigation items are accessible on mobile</li>
//               </ul>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </DashboardLayout>
//   )
// }
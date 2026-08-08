import { Card, CardContent } from "@/components/ui/card";
import type { UserStat } from "@/types/learning.types";

interface CourseStatsProps {
  stats: UserStat[];
}

export function CourseStats({ stats }: CourseStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="card-hover border-l-4 border-l-primary/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div
                className={`text-xs ${
                  stat.trend === "up" ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                {stat.change}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

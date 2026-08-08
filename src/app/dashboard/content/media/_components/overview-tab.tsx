import React from "react";

import type { MediaStatistics } from "@/types/media.types";
import { formatNumber, getMediaIcon } from "./media-helpers";

interface OverviewTabProps {
  statistics: MediaStatistics | null;
}

export function OverviewTab({ statistics }: OverviewTabProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Uploads */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Uploads</h3>
          <div className="space-y-3">
            {statistics?.recentUploads.slice(0, 5).map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-2">
                    {React.createElement(getMediaIcon(upload.type), { className: "h-4 w-4" })}
                    <div>
                      <p className="text-sm font-medium truncate">{upload.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {upload.uploadedBy} • {upload.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {(upload.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage by Type */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Storage by Type</h3>
          <div className="space-y-3">
            {statistics?.mediaByType.map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-2">
                    {React.createElement(getMediaIcon(type.type), { className: "h-4 w-4" })}
                    <div>
                      <p className="text-sm font-medium capitalize">{type.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.count} items • {type.sizeFormatted}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{type.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Media */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Top Performing Media</h3>
        <div className="space-y-3">
          {statistics?.topPerforming.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="min-w-0 flex-1 mr-2">
                <div className="flex items-center gap-2">
                  {React.createElement(getMediaIcon(item.type), { className: "h-4 w-4" })}
                  <div>
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.views)} views • {formatNumber(item.downloads)} downloads
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{item.usage}</p>
                <p className="text-xs text-muted-foreground">usage</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

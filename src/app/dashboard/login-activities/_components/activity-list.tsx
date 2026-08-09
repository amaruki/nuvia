import { formatDate } from "@/lib/utils/date-utils";
import { getActivityIcon } from "@/lib/utils/activity-icons";
import type { LoginActivity } from "./types";

function getDeviceName(userAgent: string) {
  // Simple device detection based on user agent
  if (userAgent.includes("Mobile")) {
    return "Mobile Device";
  } else if (userAgent.includes("Tablet")) {
    return "Tablet";
  } else if (userAgent.includes("Windows")) {
    return "Windows PC";
  } else if (userAgent.includes("Mac")) {
    return "Mac";
  } else if (userAgent.includes("Linux")) {
    return "Linux PC";
  }
  return "Unknown Device";
}

interface ActivityListProps {
  activities: LoginActivity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <li className="px-6 py-4 text-center text-foreground/50">No login activity found</li>
        ) : (
          activities.map((activity) => (
            <li key={activity.id}>
              <div className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.successful, activity.deviceType)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">
                        {getDeviceName(activity.userAgent)}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p
                          className={`text-xs font-medium ${
                            activity.successful ? "text-success" : "text-destructive"
                          }`}
                        >
                          {activity.successful ? "Successful" : "Failed"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-foreground/50">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-foreground/40"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {activity.location && activity.location !== "Unknown"
                            ? activity.location
                            : "Location Unknown"}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-foreground/50 sm:mt-0 sm:ml-6">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-foreground/40"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {activity.ipAddress}
                        </p>
                      </div>
                      <div className="text-sm text-foreground/50">
                        {formatDate(activity.loginAt, "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

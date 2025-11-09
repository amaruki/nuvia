'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils/date-utils';
import { getDeviceIcon } from '@/lib/utils/activity-icons';

interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  isActive: boolean;
}

interface ActiveDevicesResponse {
  success: boolean;
  data: {
    devices: Device[];
  };
  message: string;
  errors: Record<string, string[]> | undefined;
  meta: {
    timestamp: string;
    version: string;
  };
}

export default function ActiveDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveDevices();
  }, []);

  const fetchActiveDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, you would get the user ID from the session
      const userId = 'user-id-placeholder'; // This would come from authentication
      
      const response = await fetch('/api/v1/auth/active-devices', {
        headers: {
          'x-user-id': userId,
        },
      });
      
      const data: ActiveDevicesResponse = await response.json();
      
      if (data.success) {
        setDevices(data.data.devices);
        // In a real implementation, you would get the current device ID from the session
        setCurrentDeviceId('current-device-id-placeholder');
      } else {
        setError(data.message || 'Failed to fetch active devices');
      }
    } catch (err) {
      setError('An error occurred while fetching active devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateDevice = async (deviceId: string) => {
    try {
      // In a real implementation, you would get the user ID from the session
      const userId = 'user-id-placeholder'; // This would come from authentication
      
      const response = await fetch(`/api/v1/auth/active-devices?deviceId=${deviceId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the devices list
        fetchActiveDevices();
      } else {
        setError(data.message || 'Failed to deactivate device');
      }
    } catch (err) {
      setError('An error occurred while deactivating device');
      console.error(err);
    }
  };

  const handleDeactivateOtherDevices = async () => {
    if (!currentDeviceId) return;
    
    try {
      // In a real implementation, you would get the user ID from the session
      const userId = 'user-id-placeholder'; // This would come from authentication
      
      const response = await fetch('/api/v1/auth/deactivate-other-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          currentDeviceId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the devices list
        fetchActiveDevices();
      } else {
        setError(data.message || 'Failed to deactivate other devices');
      }
    } catch (err) {
      setError('An error occurred while deactivating other devices');
      console.error(err);
    }
  };

  const isCurrentDevice = (deviceId: string) => {
    return deviceId === currentDeviceId;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Active Devices</h1>
          <p className="text-foreground/70 mt-2">
            Manage devices that are currently logged into your account.
          </p>
        </div>
        {devices.length > 1 && (
          <button
            onClick={handleDeactivateOtherDevices}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
          >
            Sign Out All Other Devices
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-destructive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <div className="mt-2 text-sm text-destructive">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {devices.length === 0 ? (
              <li className="px-6 py-4 text-center text-foreground/50">
                No active devices found
              </li>
            ) : (
              devices.map((device) => (
                <li key={device.deviceId}>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-primary">
                              {device.deviceName || 'Unknown Device'}
                            </h3>
                            {isCurrentDevice(device.deviceId) && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/20 text-success">
                                Current Device
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-foreground/50">
                            <div className="flex items-center">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-foreground/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {device.ipAddress}
                            </div>
                            <div className="mt-1 flex items-center">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-foreground/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Last active: {formatDate(device.lastActive, 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {!isCurrentDevice(device.deviceId) && (
                          <button
                            onClick={() => handleDeactivateDevice(device.deviceId)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-destructive bg-destructive/20 hover:bg-destructive/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <div className="mt-8 bg-info/10 border border-info/30 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-info" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-info">Security Tip</h3>
            <div className="mt-2 text-sm text-info">
              <p>
                If you don&apos;t recognize a device or location, sign out immediately and change your password.
                This will help protect your account from unauthorized access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
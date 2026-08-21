"use client";

import * as React from "react";
import { useRecentTransfers } from "@/hooks/use-contract";
import { ActivityItem } from "@/components/activity/activity-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TransferRecord } from "@/lib/types";
import { Activity, RefreshCw, Inbox } from "lucide-react";

function ActivityFeed() {
  const { data: transfers, isLoading, refetch, isFetching } = useRecentTransfers(10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Recent Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : !transfers || transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mb-3">
              <Inbox className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-600 mt-1">
              Your transfers will appear here once you start sending.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((transfer: TransferRecord, index: number) => (
              <ActivityItem key={transfer.id || index} transfer={transfer} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityFeed };

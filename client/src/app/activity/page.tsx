"use client";

import { ActivityFeed } from "@/components/activity/activity-feed";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="h-8 w-8 text-cyan-400" />
          Activity Feed
        </h1>
        <p className="text-gray-400 mt-1">
          Live on-chain transfer activity from the SendBridge contract
        </p>
      </div>

      <ActivityFeed />
    </div>
  );
}

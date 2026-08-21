"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  ShieldCheck,
  Cog,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";

interface StatusTimelineProps {
  currentStatus: string;
}

type StepKey =
  | "created"
  | "kyc_verified"
  | "processing"
  | "settled"
  | "completed"
  | "cancelled"
  | "failed";

interface Step {
  key: StepKey;
  label: string;
  icon: React.ReactNode;
}

const MAIN_STEPS: Step[] = [
  { key: "created", label: "Created", icon: <FileText className="h-4 w-4" /> },
  {
    key: "kyc_verified",
    label: "KYC Verified",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    key: "processing",
    label: "Processing",
    icon: <Cog className="h-4 w-4" />,
  },
  {
    key: "settled",
    label: "Settled",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    key: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

const STATUS_STEP_MAP: Record<string, StepKey> = {
  building: "created",
  signing: "created",
  submitting: "kyc_verified",
  polling: "processing",
  success: "completed",
  error: "failed",
  idle: "created",
  created: "created",
  kyc_verified: "kyc_verified",
  processing: "processing",
  settled: "settled",
  completed: "completed",
  cancelled: "cancelled",
  failed: "failed",
};

function getStepState(
  stepIndex: number,
  activeIndex: number,
  isTerminal: boolean,
  isFailed: boolean
): "done" | "active" | "pending" | "failed" {
  if (isFailed && stepIndex > activeIndex) return "failed";
  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return isTerminal ? "done" : "active";
  return "pending";
}

const STATE_STYLES = {
  done: "bg-emerald-600 text-white border-emerald-600",
  active: "bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-600/30 animate-pulse",
  pending: "bg-white/5 text-gray-500 border-white/10",
  failed: "bg-red-600/20 text-red-400 border-red-600/30",
};

const LINE_STYLES = {
  done: "bg-emerald-600",
  active: "bg-cyan-600",
  pending: "bg-white/10",
  failed: "bg-red-600/30",
};

function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const activeStepKey = STATUS_STEP_MAP[currentStatus] || "created";
  const activeIndex = MAIN_STEPS.findIndex((s) => s.key === activeStepKey);
  const isFailed = currentStatus === "failed" || currentStatus === "error";
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {MAIN_STEPS.map((step, i) => {
          const state = getStepState(i, activeIndex, false, isFailed);
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-2 relative">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                    STATE_STYLES[state]
                  )}
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : state === "failed" ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap",
                    state === "done" && "text-emerald-400",
                    state === "active" && "text-cyan-400",
                    state === "pending" && "text-gray-500",
                    state === "failed" && "text-red-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < MAIN_STEPS.length - 1 && (
                <div className="flex-1 mx-1">
                  <div
                    className={cn(
                      "h-0.5 rounded-full transition-all duration-300",
                      LINE_STYLES[
                        getStepState(i, activeIndex, false, isFailed)
                      ]
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {(isFailed || isCancelled) && (
        <div className="mt-4 flex justify-center">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
              isFailed
                ? "bg-red-600/10 text-red-400 border border-red-600/20"
                : "bg-white/5 text-gray-400 border border-white/10"
            )}
          >
            {isFailed ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            {isFailed ? "Transfer Failed" : "Transfer Cancelled"}
          </div>
        </div>
      )}
    </div>
  );
}

export { StatusTimeline };

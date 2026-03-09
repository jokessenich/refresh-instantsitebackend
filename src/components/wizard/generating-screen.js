"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import { GridBG } from "@/components/ui/decorative";

const STAGES = [
  { key: "queued", label: "Queuing your request..." },
  { key: "generating", label: "AI is crafting your website..." },
  { key: "validating", label: "Validating output..." },
  { key: "generated", label: "Website generated!" },
  { key: "deploying", label: "Deploying to the web..." },
  { key: "ready", label: "Your site is live!" },
];

const STATUS_TO_STAGE = {
  DRAFT: 0,
  QUEUED: 0,
  GENERATING: 1,
  VALIDATING: 2,
  GENERATED: 3,
  DEPLOYING: 4,
  READY: 5,
  FAILED: -1,
};

function getOrCreateUserId() {
  if (typeof window === "undefined") return "anon";
  return window.sessionStorage.getItem("ss-user-id") || "anon";
}

export function GeneratingScreen({ requestId, onComplete, onError }) {
  const [stage, setStage] = useState(0);
  const [statusText, setStatusText] = useState("Starting...");
  const [deployTriggered, setDeployTriggered] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!requestId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/site-requests/${requestId}/status`, {
          headers: { "x-user-id": getOrCreateUserId() },
        });

        if (!res.ok) {
          console.error("Status poll failed:", res.status);
          return;
        }

        const data = await res.json();
        const backendStatus = data.status?.toUpperCase() || "QUEUED";
        const stageIndex = STATUS_TO_STAGE[backendStatus] ?? 0;

        if (backendStatus === "FAILED") {
          clearInterval(pollRef.current);
          onError(data.errorMessage || "Generation failed. Please try again.");
          return;
        }

        setStage(stageIndex);
        setStatusText(STAGES[stageIndex]?.label || "Processing...");

        // When generated, trigger deploy automatically
        if (backendStatus === "GENERATED" && !deployTriggered) {
          setDeployTriggered(true);
          triggerDeploy(requestId);
        }

        // When ready, we're done
        if (backendStatus === "READY" && data.previewUrl) {
          clearInterval(pollRef.current);
          // Brief pause to show the "live" state
          setTimeout(() => onComplete(data.previewUrl), 800);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    pollRef.current = setInterval(poll, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [requestId, deployTriggered, onComplete, onError]);

  const triggerDeploy = async (id) => {
    try {
      const res = await fetch(`/api/site-requests/${id}/deploy`, {
        method: "POST",
        headers: { "x-user-id": getOrCreateUserId() },
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Deploy trigger failed:", err);
        // Don't error out — the poll will catch the status
      }
    } catch (err) {
      console.error("Deploy trigger error:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] bg-bg flex flex-col items-center justify-center gap-10"
    >
      <GridBG />

      <div className="relative z-10 text-center">
        {/* Animated icon */}
        <div className="w-16 h-16 rounded-[18px] bg-accent-dim border border-accent/20 flex items-center justify-center mx-auto mb-8 relative">
          <Icons.Sparkles size={28} className="text-accent animate-float" />
          <div className="absolute -inset-2 rounded-[22px] border border-accent/10 animate-pulse-ring" />
        </div>

        {/* Progress steps */}
        <div className="flex flex-col gap-2.5 min-h-[200px]">
          {STAGES.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.2, x: 10 }}
              animate={{
                opacity: i <= stage ? 1 : 0.2,
                x: i <= stage ? 0 : 10,
              }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 justify-center"
            >
              <div
                className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all duration-300 ${
                  i < stage
                    ? "bg-success-dim border border-success/30"
                    : i === stage
                      ? "bg-accent-dim border border-accent/30"
                      : "bg-transparent border border-border"
                }`}
              >
                {i < stage && (
                  <Icons.Check size={10} className="text-success" />
                )}
                {i === stage && (
                  <div className="w-1.5 h-1.5 rounded-sm bg-accent animate-progress-pulse" />
                )}
              </div>
              <span
                className={`font-mono text-[13px] ${
                  i <= stage ? "text-text-primary" : "text-text-dim"
                } ${i === stage ? "font-medium" : "font-normal"}`}
              >
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Elapsed time */}
        <ElapsedTimer />
      </div>
    </motion.div>
  );
}

function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <p className="text-xs text-text-dim mt-8 font-mono">
      {minutes > 0 ? `${minutes}m ` : ""}
      {seconds}s elapsed
    </p>
  );
}

"use client";
import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import UpgradeModal from "./UpgradeModal";
import type { PlanFeatures } from "@/lib/subscription";

interface Props {
  feature:     keyof PlanFeatures;
  featureName: string;
  children:    ReactNode;
  fallback?:   ReactNode;
  lockStyle?:  "overlay" | "blur" | "hide";
}

export default function FeatureGate({ feature, featureName, children, fallback, lockStyle = "overlay" }: Props) {
  const { can }              = useSubscription();
  const [showModal, setShow] = useState(false);

  if (can(feature)) return <>{children}</>;

  if (lockStyle === "hide") return null;

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShow(true)}
        title={`Upgrade to unlock ${featureName}`}
      >
        <div className={`pointer-events-none select-none transition-all ${lockStyle === "blur" ? "blur-[3px] opacity-40" : "opacity-40"}`}>
          {fallback ?? children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/30 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] font-semibold text-amber-400 bg-black/40 px-2 py-0.5 rounded-full">
            Upgrade to unlock
          </span>
        </div>
      </div>

      {showModal && (
        <UpgradeModal
          feature={feature}
          featureName={featureName}
          onClose={() => setShow(false)}
        />
      )}
    </>
  );
}

"use client";

import { Icons } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="px-6 py-10 border-t border-border max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center">
            <Icons.Zap size={12} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            InstantSite
          </span>
        </div>
        <span className="text-[13px] text-text-dim">
          &copy; {new Date().getFullYear()} InstantSite. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui";

export function Nav({ onGenerate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-300 ${
        scrolled
          ? "bg-bg/90 backdrop-blur-xl border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center">
            <Icons.Zap size={15} className="text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight">
            InstantSite
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <a href="#pricing">
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
          </a>
          <a href="#examples">
            <Button variant="ghost" size="sm">
              Examples
            </Button>
          </a>
          <Button variant="primary" size="sm" onClick={onGenerate}>
            Generate Website
          </Button>
        </div>
      </div>
    </nav>
  );
}

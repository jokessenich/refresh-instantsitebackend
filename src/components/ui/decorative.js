"use client";

import { Icons } from "@/components/ui/icons";

export function GridBG() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 animate-grid-fade"
        style={{
          backgroundImage: `
            linear-gradient(rgba(39,39,42,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(39,39,42,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.05)_0%,transparent_60%)]" />
    </div>
  );
}

export function FlowIllustration() {
  const steps = [
    { icon: <Icons.FileText size={22} />, label: "Form", color: "#818cf8" },
    { icon: <Icons.Sparkles size={22} />, label: "AI Gen", color: "#c084fc" },
    { icon: <Icons.Globe size={22} />, label: "Live Site", color: "#34d399" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 py-10 px-5">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className="flex flex-col items-center gap-2.5 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.8 + i * 0.2}s`, animationFillMode: "forwards" }}
          >
            <div
              className="w-14 h-14 rounded-[14px] flex items-center justify-center animate-float"
              style={{
                background: `${step.color}12`,
                border: `1px solid ${step.color}30`,
                color: step.color,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {step.icon}
            </div>
            <span className="text-xs text-text-dim font-medium">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-12 h-px mx-2 mb-[26px] opacity-0 animate-fade-in-up"
              style={{
                background: `linear-gradient(90deg, ${step.color}40, ${steps[i + 1].color}40)`,
                animationDelay: `${1.0 + i * 0.2}s`,
                animationFillMode: "forwards",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

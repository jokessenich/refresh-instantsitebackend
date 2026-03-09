"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Icons } from "./icons";

// ─── BUTTON ──────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ease-out border-none font-sans tracking-tight whitespace-nowrap";

  const variants = {
    primary:
      "bg-accent text-white shadow-[0_0_0_1px_rgba(129,140,248,0.3),0_2px_8px_rgba(129,140,248,0.2)] hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_0_0_1px_rgba(129,140,248,0.4),0_4px_16px_rgba(129,140,248,0.3)]",
    secondary:
      "bg-transparent text-text-muted border border-border hover:border-text-dim hover:text-text-primary",
    ghost: "bg-transparent text-text-muted hover:text-text-primary",
  };

  const sizes = {
    sm: "px-4 py-2 text-[13px]",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-[15px]",
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
export function Input({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] text-text-muted font-medium">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="px-3.5 py-2.5 bg-bg border border-border rounded-[10px] text-text-primary text-sm outline-none transition-colors duration-200 focus:border-accent font-sans placeholder:text-text-dim"
      />
    </div>
  );
}

// ─── TEXTAREA ────────────────────────────────────────────────────────────────
export function TextArea({ label, placeholder, value, onChange, rows = 4 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] text-text-muted font-medium">
          {label}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="px-3.5 py-2.5 bg-bg border border-border rounded-[10px] text-text-primary text-sm outline-none resize-y transition-colors duration-200 focus:border-accent font-sans leading-relaxed placeholder:text-text-dim"
      />
    </div>
  );
}

// ─── SELECT ──────────────────────────────────────────────────────────────────
export function Select({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] text-text-muted font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 pr-9 bg-bg border border-border rounded-[10px] text-text-primary text-sm outline-none appearance-none cursor-pointer font-sans transition-colors duration-200 focus:border-accent"
        >
          {options.map((o) => (
            <option
              key={o.value}
              value={o.value}
              className="bg-surface text-text-primary"
            >
              {o.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim">
          <Icons.ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}

// ─── UPLOAD ZONE ─────────────────────────────────────────────────────────────
export function UploadZone({ label, hint }) {
  const [file, setFile] = useState(null);

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => setFile(e.target.files[0]);
    input.click();
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] text-text-muted font-medium">
          {label}
        </label>
      )}
      <div
        onClick={handleClick}
        className={`p-6 border-[1.5px] border-dashed rounded-[10px] flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
          file
            ? "border-accent bg-accent-dim"
            : "border-border hover:border-text-dim"
        }`}
      >
        {file ? (
          <>
            <Icons.Check size={20} className="text-accent" />
            <span className="text-[13px] text-accent">{file.name}</span>
          </>
        ) : (
          <>
            <Icons.Upload size={20} className="text-text-dim" />
            <span className="text-[13px] text-text-dim">
              {hint || "Click to upload"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
export function Badge({ children }) {
  return (
    <span className="inline-flex px-2.5 py-1 bg-accent-dim text-accent rounded-md text-xs font-medium tracking-wide">
      {children}
    </span>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", hoverable, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border rounded-[14px] overflow-hidden transition-all duration-300 ease-out ${
        hoverable
          ? "cursor-pointer hover:border-text-dim hover:-translate-y-0.5"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── OPTION SELECTOR ─────────────────────────────────────────────────────────
export function OptionSelector({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] text-text-muted font-medium">
          {label}
        </label>
      )}
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer font-sans transition-all duration-200 ${
              value === opt
                ? "border border-accent bg-accent-dim text-accent"
                : "border border-border bg-transparent text-text-muted hover:border-text-dim"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
export function StepIndicator({ current, total }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${
            i <= current ? "bg-accent" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

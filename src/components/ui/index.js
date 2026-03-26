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
export function UploadZone({ label, hint, multiple, onChange, files: controlledFiles }) {
  const [localFiles, setLocalFiles] = useState([]);
  const files = controlledFiles ?? localFiles;

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = !!multiple;
    input.onchange = (e) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;

      // Convert each file to base64
      const promises = selected.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: reader.result,
              });
            reader.readAsDataURL(file);
          })
      );

      Promise.all(promises).then((results) => {
        const newFiles = multiple ? [...files, ...results] : results;
        setLocalFiles(newFiles);
        if (onChange) onChange(newFiles);
      });
    };
    input.click();
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setLocalFiles(newFiles);
    if (onChange) onChange(newFiles);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] text-text-muted font-medium">
          {label}
        </label>
      )}
      {files.length > 0 ? (
        <div className="flex flex-col gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="p-3 border border-accent/30 bg-accent-dim rounded-[10px] flex items-center gap-3"
            >
              <img
                src={f.dataUrl}
                alt={f.name}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-text-primary truncate">{f.name}</div>
                <div className="text-[11px] text-text-dim">{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="w-6 h-6 rounded border border-border bg-transparent text-text-dim cursor-pointer flex items-center justify-center hover:text-text-primary transition-colors"
              >
                <Icons.X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={handleClick}
            className="text-[13px] text-accent hover:text-accent-hover cursor-pointer bg-transparent border-none font-sans text-left"
          >
            + Add {multiple ? "more" : "another"}
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="p-6 border-[1.5px] border-dashed rounded-[10px] flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 border-border hover:border-text-dim"
        >
          <Icons.Upload size={20} className="text-text-dim" />
          <span className="text-[13px] text-text-dim">
            {hint || "Click to upload"}
          </span>
        </div>
      )}
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

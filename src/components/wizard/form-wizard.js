"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import {
  Button,
  Input,
  TextArea,
  UploadZone,
  OptionSelector,
  StepIndicator,
} from "@/components/ui";
import { COLOR_PALETTES } from "@/lib/constants";

// ─── Content mode selector (Write / Upload / Import) ────────────────────────
function ContentModeSelector({ contentMode, setContentMode, onReset }) {
  const modes = [
    {
      key: "write",
      icon: <Icons.Edit size={16} />,
      label: "Write it",
      desc: "Describe your business",
    },
    {
      key: "upload",
      icon: <Icons.Upload size={16} />,
      label: "Upload a file",
      desc: "PDF, DOC, or TXT",
    },
    {
      key: "import",
      icon: <Icons.Link size={16} />,
      label: "Import from URL",
      desc: "We'll pull your content",
    },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-text-muted font-medium">
        Tell us about your business
      </label>
      <div className="grid grid-cols-3 gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              if (m.key !== contentMode) onReset();
              setContentMode(m.key);
            }}
            className={`flex flex-col items-center gap-1.5 p-4 rounded-[10px] cursor-pointer font-sans transition-all duration-200 ${
              contentMode === m.key
                ? "border border-accent bg-accent-dim"
                : "border border-border bg-transparent hover:border-text-dim"
            }`}
          >
            <div
              className={
                contentMode === m.key ? "text-accent" : "text-text-dim"
              }
            >
              {m.icon}
            </div>
            <span
              className={`text-[13px] font-medium ${
                contentMode === m.key ? "text-accent" : "text-text-primary"
              }`}
            >
              {m.label}
            </span>
            <span className="text-[11px] text-text-dim text-center leading-tight">
              {m.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Content area based on mode ──────────────────────────────────────────────
function ContentArea({
  contentMode,
  about,
  setAbout,
  uploadedFile,
  setUploadedFile,
  importUrl,
  setImportUrl,
  importing,
  setImporting,
  imported,
  setImported,
}) {
  if (!contentMode) return null;

  const handleImport = () => {
    if (!importUrl) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImported(true);
      setAbout(
        `[Imported from ${importUrl}] — Content will be extracted from your existing website during generation.`
      );
    }, 2000);
  };

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt,.md";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploadedFile(file);
        setAbout(
          `[Uploaded: ${file.name}] — Content will be extracted from your document during generation.`
        );
      }
    };
    input.click();
  };

  if (contentMode === "write") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <TextArea
          label="About your business"
          placeholder="Describe your business — what you do, who you serve, your services, location, and what makes you unique. The more detail, the better the site."
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={6}
        />
        <p className="text-xs text-text-dim mt-2 leading-relaxed">
          Include your services, location, and anything you'd want on the site.
          We'll extract the details.
        </p>
      </motion.div>
    );
  }

  if (contentMode === "upload") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {uploadedFile ? (
          <div className="p-5 rounded-[10px] border border-accent/30 bg-accent-dim flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Icons.FileText size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {uploadedFile.name}
              </div>
              <div className="text-xs text-text-dim mt-0.5">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <button
              onClick={() => {
                setUploadedFile(null);
                setAbout("");
              }}
              className="w-7 h-7 rounded-md border border-border bg-transparent text-text-dim cursor-pointer flex items-center justify-center hover:text-text-primary transition-colors"
            >
              <Icons.X size={12} />
            </button>
          </div>
        ) : (
          <div
            onClick={handleFileUpload}
            className="p-8 rounded-[10px] border-[1.5px] border-dashed border-border flex flex-col items-center gap-2.5 cursor-pointer transition-colors hover:border-text-dim"
          >
            <Icons.Upload size={22} className="text-text-dim" />
            <span className="text-sm text-text-muted font-medium">
              Click to upload a document
            </span>
            <span className="text-xs text-text-dim">
              PDF, DOC, DOCX, TXT, or MD
            </span>
          </div>
        )}
        <p className="text-xs text-text-dim mt-2 leading-relaxed">
          Upload an existing document about your business — a brochure, about
          page, or notes. We'll extract everything we need.
        </p>
      </motion.div>
    );
  }

  if (contentMode === "import") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {imported ? (
          <div className="p-5 rounded-[10px] border border-success/30 bg-success-dim flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-success/20 flex items-center justify-center flex-shrink-0">
              <Icons.Check size={18} className="text-success" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">
                Website content queued for import
              </div>
              <div className="font-mono text-xs text-text-dim mt-0.5">
                {importUrl}
              </div>
            </div>
            <button
              onClick={() => {
                setImported(false);
                setImportUrl("");
                setAbout("");
              }}
              className="w-7 h-7 rounded-md border border-border bg-transparent text-text-dim cursor-pointer flex items-center justify-center hover:text-text-primary transition-colors"
            >
              <Icons.X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="url"
                placeholder="https://yourbusiness.com"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-[10px] text-text-primary text-sm outline-none font-mono transition-colors focus:border-accent placeholder:text-text-dim"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleImport}
              disabled={!importUrl || importing}
            >
              {importing ? (
                <Icons.Loader
                  size={14}
                  className="animate-spin"
                />
              ) : (
                "Import"
              )}
            </Button>
          </div>
        )}
        <p className="text-xs text-text-dim mt-2 leading-relaxed">
          Paste your current website URL and we'll scrape your business info,
          services, and content to build your new site.
        </p>
      </motion.div>
    );
  }

  return null;
}

// ─── Main Form Wizard ────────────────────────────────────────────────────────
export function FormWizard({ onClose, onGenerate }) {
  const [step, setStep] = useState(0);
  const [contentMode, setContentMode] = useState(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [form, setForm] = useState({
    businessName: "",
    about: "",
    contactEmail: "",
    contactPhone: "",
    goal: "",
    colorPalette: "",
    fontStyle: "",
    siteVibe: "",
    logoFiles: [],
    imageFiles: [],
  });

  const updateForm = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const resetContentState = () => {
    setUploadedFile(null);
    setImported(false);
    setImportUrl("");
    updateForm("about", "");
  };

  const steps = [
    {
      title: "Your business",
      subtitle: "Tell us who you are — your way",
      content: (
        <div className="flex flex-col gap-5">
          <Input
            label="Business name"
            placeholder="e.g. Bloom Studio"
            value={form.businessName}
            onChange={(e) => updateForm("businessName", e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact email"
              placeholder="you@yourbusiness.com"
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateForm("contactEmail", e.target.value)}
            />
            <Input
              label="Phone (optional)"
              placeholder="(555) 123-4567"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => updateForm("contactPhone", e.target.value)}
            />
          </div>
          <ContentModeSelector
            contentMode={contentMode}
            setContentMode={setContentMode}
            onReset={resetContentState}
          />
          <ContentArea
            contentMode={contentMode}
            about={form.about}
            setAbout={(v) => updateForm("about", v)}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            importUrl={importUrl}
            setImportUrl={setImportUrl}
            importing={importing}
            setImporting={setImporting}
            imported={imported}
            setImported={setImported}
          />
        </div>
      ),
    },
    {
      title: "Media",
      subtitle: "Upload your logo and images",
      content: (
        <div className="flex flex-col gap-5">
          <UploadZone
            label="Logo"
            hint="Upload your logo (PNG, SVG, JPG)"
            files={form.logoFiles}
            onChange={(files) => updateForm("logoFiles", files)}
          />
          <UploadZone
            label="Images"
            hint="Upload photos of your business, team, or products"
            multiple
            files={form.imageFiles}
            onChange={(files) => updateForm("imageFiles", files)}
          />
          <div className="p-4 rounded-[10px] bg-accent-dim border border-accent/20">
            <p className="text-[13px] text-text-muted leading-relaxed">
              <span className="text-accent font-medium">Tip:</span> Upload
              high-quality images for the best results. If you don't have
              images, our AI will select professional stock photos that match
              your business.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Design preferences",
      subtitle: "How should your site look and feel?",
      content: (
        <div className="flex flex-col gap-6">
          <OptionSelector
            label="Primary goal of website"
            options={["Generate Leads", "Portfolio", "Informational"]}
            value={form.goal}
            onChange={(val) => updateForm("goal", val)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-text-muted font-medium">
              Color palette
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => updateForm("colorPalette", palette.name)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-[10px] cursor-pointer transition-all duration-200 ${
                    form.colorPalette === palette.name
                      ? "border border-accent bg-accent-dim"
                      : "border border-border bg-transparent hover:border-text-dim"
                  }`}
                >
                  <div className="flex gap-[3px]">
                    {palette.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-[18px] h-[18px] rounded border border-border"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      form.colorPalette === palette.name
                        ? "text-accent"
                        : "text-text-dim"
                    }`}
                  >
                    {palette.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <OptionSelector
            label="Font style"
            options={["Modern", "Elegant", "Bold"]}
            value={form.fontStyle}
            onChange={(val) => updateForm("fontStyle", val)}
          />

          <OptionSelector
            label="Site vibe"
            options={["Professional", "Playful", "Minimal"]}
            value={form.siteVibe}
            onChange={(val) => updateForm("siteVibe", val)}
          />
        </div>
      ),
    },
    {
      title: "Review",
      subtitle: "Confirm your details",
      content: (
        <div className="flex flex-col gap-0.5">
          {[
            ["Business name", form.businessName || "—"],
            ["Contact email", form.contactEmail || "—"],
            ["Phone", form.contactPhone || "—"],
            [
              "Content source",
              contentMode === "write"
                ? "Written manually"
                : contentMode === "upload"
                  ? `File: ${uploadedFile?.name || "—"}`
                  : contentMode === "import"
                    ? `URL: ${importUrl || "—"}`
                    : "—",
            ],
            ["Website goal", form.goal || "—"],
            ["Color palette", form.colorPalette || "—"],
            ["Font style", form.fontStyle || "—"],
            ["Site vibe", form.siteVibe || "—"],
            ["Logo", form.logoFiles.length > 0 ? form.logoFiles[0].name : "None"],
            ["Images", form.imageFiles.length > 0 ? `${form.imageFiles.length} uploaded` : "None"],
          ].map(([label, value], i) => (
            <div
              key={i}
              className="flex justify-between items-center py-3.5 border-b border-border-subtle"
            >
              <span className="text-[13px] text-text-dim">{label}</span>
              <span className="text-sm text-text-primary font-medium text-right max-w-[60%] truncate">
                {value}
              </span>
            </div>
          ))}
          {contentMode === "write" && form.about && (
            <div className="mt-3">
              <span className="text-xs text-text-dim block mb-1.5">
                Business description preview
              </span>
              <div className="p-3.5 rounded-lg bg-bg border border-border-subtle text-[13px] text-text-muted leading-relaxed max-h-[100px] overflow-hidden">
                {form.about}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-bg/95 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-[18px] p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.02em]">
              {steps[step].title}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              {steps[step].subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border bg-transparent text-text-dim cursor-pointer flex items-center justify-center hover:text-text-primary transition-colors"
          >
            <Icons.X size={14} />
          </button>
        </div>

        <StepIndicator current={step} total={steps.length} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2.5 mt-8 justify-between">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              <Icons.ArrowLeft size={14} /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Continue <Icons.ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" onClick={() => onGenerate(form)}>
              <Icons.Sparkles size={14} /> Generate My Website
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

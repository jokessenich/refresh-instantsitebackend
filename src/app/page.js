"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";

// Layout
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

// Landing sections
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { ExampleWebsites } from "@/components/sections/examples";
import { Pricing } from "@/components/sections/pricing";
import { FAQ } from "@/components/sections/faq";

// Wizard flow
import { FormWizard } from "@/components/wizard/form-wizard";
import { GeneratingScreen } from "@/components/wizard/generating-screen";
import { PreviewPage } from "@/components/wizard/preview-page";

export default function Home() {
  const [view, setView] = useState("landing");
  const [formData, setFormData] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleStartGenerate = useCallback(() => setView("wizard"), []);
  const handleCloseWizard = useCallback(() => setView("landing"), []);

  const handleGenerate = useCallback(async (data) => {
    setFormData(data);
    setError(null);
    setView("generating");

    try {
      // Step 1: Create site request
      const createRes = await fetch("/api/site-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getOrCreateUserId(),
        },
        body: JSON.stringify({
          businessName: data.businessName || "My Business",
          businessType: mapBusinessType(data),
          primaryGoal: data.goal || "Generate Leads",
          services: extractServices(data.about),
          about: data.about || "",
          differentiators: [],
          contactEmail: data.contactEmail || "hello@example.com",
          contactPhone: data.contactPhone || undefined,
          colorPreference: data.colorPalette || undefined,
          fontPreference: data.fontStyle || undefined,
          siteVibe: data.siteVibe || undefined,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create site request");
      }

      const { id } = await createRes.json();
      setRequestId(id);

      // Step 2: Trigger generation
      const genRes = await fetch(`/api/site-requests/${id}/generate`, {
        method: "POST",
        headers: { "x-user-id": getOrCreateUserId() },
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Failed to start generation");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.message);
      setView("landing");
    }
  }, []);

  const handleGenerationComplete = useCallback((url) => {
    setPreviewUrl(url);
    setView("preview");
  }, []);

  const handleGenerationError = useCallback((errMsg) => {
    setError(errMsg);
    setView("landing");
  }, []);

  const handleBackToLanding = useCallback(() => {
    setView("landing");
    setRequestId(null);
    setPreviewUrl(null);
  }, []);

  return (
    <>
      {view === "landing" && <Nav onGenerate={handleStartGenerate} />}

      {view === "landing" && (
        <>
          {error && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 max-w-md text-center">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
          <Hero onGenerate={handleStartGenerate} />
          <HowItWorks />
          <ExampleWebsites />
          <Pricing onGenerate={handleStartGenerate} />
          <FAQ />
          <Footer />
        </>
      )}

      <AnimatePresence>
        {view === "wizard" && (
          <FormWizard
            onClose={handleCloseWizard}
            onGenerate={handleGenerate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === "generating" && requestId && (
          <GeneratingScreen
            requestId={requestId}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
        )}
      </AnimatePresence>

      {view === "preview" && (
        <PreviewPage
          form={formData}
          previewUrl={previewUrl}
          requestId={requestId}
          onBack={handleBackToLanding}
        />
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function getOrCreateUserId() {
  if (typeof window === "undefined") return "anon";
  let id = window.sessionStorage.getItem("ss-user-id");
  if (!id) {
    id = "user-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    window.sessionStorage.setItem("ss-user-id", id);
  }
  return id;
}

function mapBusinessType(data) {
  // Default to local-service; could be smarter with NLP later
  const about = (data.about || "").toLowerCase();
  if (about.includes("restaurant") || about.includes("food") || about.includes("menu"))
    return "restaurant";
  if (about.includes("photo") || about.includes("portrait") || about.includes("wedding"))
    return "photographer";
  if (about.includes("therapist") || about.includes("counseling") || about.includes("therapy"))
    return "therapist";
  if (about.includes("consult") || about.includes("strategy") || about.includes("advisory"))
    return "consultant";
  if (about.includes("contractor") || about.includes("plumbing") || about.includes("roofing") || about.includes("construction"))
    return "contractor";
  return "local-service";
}

function extractServices(about) {
  if (!about || about.length < 10) return ["General Services"];
  // Simple extraction: split on commas or common delimiters, take first few chunks
  const sentences = about.split(/[.,;]\s*/);
  const services = sentences
    .filter((s) => s.length > 5 && s.length < 100)
    .slice(0, 6);
  return services.length > 0 ? services : ["General Services"];
}

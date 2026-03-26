"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui";
import { FAQS } from "@/lib/constants";

export function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 px-6 max-w-[720px] mx-auto">
      <div className="text-center mb-16">
        <Badge>FAQ</Badge>
        <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.03em] mt-4">
          Common questions
        </h2>
      </div>

      <div className="flex flex-col gap-0.5">
        {FAQS.map((faq, i) => (
          <div key={i} className="border-b border-border overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full py-5 flex items-center justify-between bg-transparent border-none text-text-primary text-[15px] font-medium cursor-pointer font-sans text-left tracking-tight"
            >
              {faq.q}
              <Icons.ChevronDown
                size={16}
                className={`text-text-dim flex-shrink-0 ml-4 transition-transform duration-300 ${
                  open === i ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-text-muted leading-relaxed pb-5">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

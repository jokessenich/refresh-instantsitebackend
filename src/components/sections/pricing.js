"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import { Badge, Button, Card } from "@/components/ui";
import { PRICING_FEATURES } from "@/lib/constants";

export function Pricing({ onGenerate }) {
  return (
    <section id="pricing" className="py-24 px-6 max-w-[1200px] mx-auto">
      <div className="text-center mb-16">
        <Badge>Pricing</Badge>
        <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.03em] mt-4">
          Simple, transparent pricing
        </h2>
        <p className="text-text-muted mt-3 text-base">
          One price. Everything included. No subscriptions.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[440px] mx-auto"
      >
        <Card className="p-10 border-accent/20 bg-gradient-to-b from-surface to-bg">
          <div className="text-center mb-8">
            <span className="text-sm text-text-muted font-medium">
              Per website
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-5xl font-bold tracking-[-0.04em]">
                $499
              </span>
            </div>
            <span className="text-sm text-text-dim">one-time payment</span>
          </div>

          <div className="flex flex-col gap-3.5 mb-8 py-6 border-y border-border">
            {PRICING_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-success-dim flex items-center justify-center flex-shrink-0">
                  <Icons.Check size={12} className="text-success" />
                </div>
                <span className="text-sm text-text-muted">{f}</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={onGenerate}
            className="w-full"
          >
            Generate My Website <Icons.ArrowRight size={16} />
          </Button>
        </Card>
      </motion.div>
    </section>
  );
}

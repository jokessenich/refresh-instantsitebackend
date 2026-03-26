"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import { Badge, Card } from "@/components/ui";

const steps = [
  {
    num: "01",
    title: "Fill out the site brief",
    desc: "Tell us about your business, services, and design preferences in a simple guided form.",
    icon: <Icons.FileText size={24} />,
  },
  {
    num: "02",
    title: "AI generates your website",
    desc: "Our AI crafts a complete, professional website with copy, layout, and imagery tailored to you.",
    icon: <Icons.Sparkles size={24} />,
  },
  {
    num: "03",
    title: "Connect your domain & launch",
    desc: "Point your domain to your new site and go live. We provide all the instructions you need.",
    icon: <Icons.Globe size={24} />,
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto">
      <div className="text-center mb-16">
        <Badge>Process</Badge>
        <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.03em] mt-4">
          How it works
        </h2>
        <p className="text-text-muted mt-3 text-base max-w-[440px] mx-auto">
          Three simple steps from idea to a live, professional website.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-8 h-full">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[13px] text-accent font-medium">
                  {step.num}
                </span>
                <div className="text-text-dim">{step.icon}</div>
              </div>
              <h3 className="text-lg font-semibold tracking-[-0.02em] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {step.desc}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

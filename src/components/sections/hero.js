"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import { Button, Badge } from "@/components/ui";
import { GridBG, FlowIllustration } from "@/components/ui/decorative";

export function Hero({ onGenerate }) {
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 overflow-hidden">
      <GridBG />

      <div className="relative z-10 max-w-[720px]">
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Badge>AI-Powered Website Generation</Badge>
        </motion.div>

        <motion.h1
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-[clamp(36px,6vw,64px)] font-bold tracking-[-0.04em] leading-[1.05] mt-6 bg-gradient-to-b from-text-primary to-text-muted bg-clip-text text-transparent"
        >
          Launch a website
          <br />
          in minutes.
        </motion.h1>

        <motion.p
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-[clamp(16px,2vw,18px)] text-text-muted leading-relaxed mt-5 max-w-[520px] mx-auto"
        >
          Describe your business, upload a few images, and we generate a live
          website instantly. No code, no templates, no waiting.
        </motion.p>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex gap-3 justify-center mt-9 flex-wrap"
        >
          <Button variant="primary" size="lg" onClick={onGenerate}>
            Generate My Website <Icons.ArrowRight size={16} />
          </Button>
          <a href="#examples">
            <Button variant="secondary" size="lg">
              See Example Sites
            </Button>
          </a>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <FlowIllustration />
        </motion.div>
      </div>
    </section>
  );
}

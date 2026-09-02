import { motion } from "framer-motion";

/**
 * Kinetic masked line-by-line reveal. Pass an array of strings — each becomes a masked line.
 */
export default function KineticHeadline({ lines = [], className = "", delay = 0.1 }) {
  return (
    <h1 className={`font-display leading-[0.92] tracking-tight ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="reveal-line">
          <motion.span
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              delay: delay + i * 0.09,
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

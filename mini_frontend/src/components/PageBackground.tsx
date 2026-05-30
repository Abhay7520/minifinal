import { motion } from "framer-motion";
interface PageBackgroundProps {
  image: string;
  /** Visual variant changes the motion + tint flavor per page */
  variant?: "drift" | "pulse" | "scan" | "depth";
}
const variantAnim = {
  drift: { scale: [1.05, 1.15, 1.05], x: ["-1%", "1%", "-1%"], y: ["0%", "-1%", "0%"] },
  pulse: { scale: [1.05, 1.12, 1.05], opacity: [0.55, 0.75, 0.55] },
  scan:  { scale: [1.05, 1.1, 1.05],  x: ["0%", "-2%", "0%"] },
  depth: { scale: [1.08, 1.0, 1.08] },
};
const PageBackground = ({ image, variant = "drift" }: PageBackgroundProps) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated image layer */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ ...variantAnim[variant], opacity: variantAnim[variant].opacity ?? 0.65 }}
        animate={{ ...variantAnim[variant], opacity: 0.7 }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Dark overlay so foreground content stays readable */}
      <div className="absolute inset-0 bg-[#050508]/75" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#050508]/40 to-[#050508]" />
      {/* Color wash to keep the orange/violet identity */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.08] via-transparent to-violet-500/[0.08]" />
      {/* Soft animated glows */}
      <motion.div
        className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-orange-500/20 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-violet-500/20 blur-[120px]"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Subtle grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="page-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#page-grid)" />
      </svg>
    </div>
  );
};
export default PageBackground;
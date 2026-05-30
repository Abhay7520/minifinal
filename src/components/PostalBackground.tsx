import { motion } from "framer-motion";
import { Package, Mail, Truck, Send, MapPin, Stamp } from "lucide-react";
import { useMemo } from "react";

const ICONS = [Package, Mail, Truck, Send, MapPin, Stamp];

interface PostalBackgroundProps {
  density?: number;
}

const PostalBackground = ({ density = 16 }: PostalBackgroundProps) => {
  const items = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 12 + Math.random() * 10,
        delay: Math.random() * 8,
        size: 20 + Math.random() * 28,
        iconIndex: Math.floor(Math.random() * ICONS.length),
        drift: 20 + Math.random() * 40,
      })),
    [density]
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] via-transparent to-violet-500/[0.04]" />
      <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-20 right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Floating postal icons */}
      {items.map((item) => {
        const Icon = ICONS[item.iconIndex];
        return (
          <motion.div
            key={item.id}
            className="absolute text-orange-400/20"
            style={{ left: `${item.left}%` }}
            initial={{ y: "110vh", rotate: 0 }}
            animate={{
              y: "-20vh",
              x: [-item.drift, item.drift, -item.drift],
              rotate: 360,
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: "linear",
              delay: item.delay,
            }}
          >
            <Icon size={item.size} />
          </motion.div>
        );
      })}

      {/* Dashed flight paths */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="postal-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#postal-grid)" />
      </svg>
    </div>
  );
};

export default PostalBackground;

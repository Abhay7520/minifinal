import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const PostcardLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050508]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      {/* Postcard animation */}
      <motion.div
        className="relative"
        animate={{
          y: [0, -18, 0],
          rotateZ: [0, -6, 6, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Card body */}
        <div className="relative flex h-24 w-40 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-orange-500/20 to-violet-600/20 backdrop-blur-sm shadow-2xl shadow-orange-500/10">
          {/* Stamp */}
          <div className="absolute right-2 top-2 h-5 w-5 rounded border border-dashed border-white/20 bg-white/5" />
          {/* Lines */}
          <div className="absolute bottom-3 left-3 right-10 space-y-1.5">
            <div className="h-[2px] w-full rounded bg-white/10" />
            <div className="h-[2px] w-3/4 rounded bg-white/10" />
            <div className="h-[2px] w-1/2 rounded bg-white/10" />
          </div>
          <Mail className="h-8 w-8 text-orange-400/60" />
        </div>
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="mt-6 text-sm font-medium text-white/40 tracking-wider"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading...
      </motion.p>
    </div>
  );
};

export default PostcardLoader;

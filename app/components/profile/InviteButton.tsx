import { motion } from 'motion/react';

export function InviteButton() {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 overflow-hidden group"
    >
      <span className="relative z-10 text-lg">✅</span>
      <span className="relative z-10">Invite Friends</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500"
        initial={{ x: '100%' }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
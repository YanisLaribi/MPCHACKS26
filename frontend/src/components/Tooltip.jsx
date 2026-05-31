import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative flex items-center gap-1 cursor-help group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 border border-indigo-200 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
        ?
      </span>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl text-center"
          >
            {text}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

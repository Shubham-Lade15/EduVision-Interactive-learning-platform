// src/components/PageFade.jsx
import React from 'react';
import { motion } from 'framer-motion';

const PageFade = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.995 }}
      transition={{ duration: 0.38, ease: [0.2, 0.9, 0.2, 1] }}
      style={{ minHeight: 'inherit' }}
    >
      {children}
    </motion.div>
  );
};

export default PageFade;

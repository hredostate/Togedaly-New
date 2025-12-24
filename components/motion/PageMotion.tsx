
import React, { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';

const PageMotion: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1] // cubic-bezier for smooth "apple-like" feel
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageMotion;

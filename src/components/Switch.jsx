import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Switch = ({ checked, onChange }) => {
  const { theme } = useTheme();
  
  return (
    <button
      className="relative w-12 h-6 rounded-full transition-colors duration-200"
      style={{ 
        backgroundColor: checked ? theme.accent : theme.inputBg,
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        className="absolute w-5 h-5 rounded-full transition-transform duration-200 transform"
        style={{ 
          backgroundColor: '#ffffff',
          left: '2px',
          top: '2px',
          transform: checked ? 'translateX(24px)' : 'translateX(0)'
        }}
      />
    </button>
  );
};

export default Switch; 
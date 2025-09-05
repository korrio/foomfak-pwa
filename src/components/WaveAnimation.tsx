import React from 'react';
import './WaveAnimation.css';

interface WaveAnimationProps {
  isRecording: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({ 
  isRecording, 
  size = 'medium',
  color = '#10b981' // green-500
}) => {
  if (!isRecording) return null;

  const sizeClasses = {
    small: 'h-6',
    medium: 'h-10',
    large: 'h-14'
  };

  const barWidths = {
    small: 'w-0.5',
    medium: 'w-1',
    large: 'w-1.5'
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${sizeClasses[size]} px-2`}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`${barWidths[size]} bg-current rounded-full ${sizeClasses[size]} wave-bar`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

// Alternative CSS-only wave animation component
export const CSSWaveAnimation: React.FC<WaveAnimationProps> = ({ 
  isRecording, 
  size = 'medium',
  color = '#10b981'
}) => {
  if (!isRecording) return null;

  const sizeClasses = {
    small: 'h-6',
    medium: 'h-10', 
    large: 'h-14'
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${sizeClasses[size]} px-2`}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-current rounded-full ${sizeClasses[size]} wave-bar`}
          style={{
            backgroundColor: color,
            animationDelay: `${i * 150}ms`,
            animation: 'wave 1.2s ease-in-out infinite'
          }}
        />
      ))}
    </div>
  );
};

// Circular pulse wave animation
export const PulseWaveAnimation: React.FC<WaveAnimationProps> = ({ 
  isRecording, 
  size = 'medium',
  color = '#10b981'
}) => {
  if (!isRecording) return null;

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Outer pulse ring */}
      <div 
        className={`absolute ${sizeClasses[size]} rounded-full animate-ping`}
        style={{ backgroundColor: color, opacity: 0.3 }}
      />
      {/* Middle pulse ring */}
      <div 
        className={`absolute ${sizeClasses[size]} rounded-full animate-pulse`}
        style={{ 
          backgroundColor: color, 
          opacity: 0.5,
          transform: 'scale(0.8)'
        }}
      />
      {/* Inner solid circle */}
      <div 
        className={`relative rounded-full ${size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-6 h-6' : 'w-8 h-8'}`}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export default WaveAnimation;
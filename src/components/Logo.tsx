import React, { useState, useEffect, useRef } from 'react';

// Using the newly generated scalable SVG assets
import BlokraIconBK from '../assets/logo_icon_bk.svg';
import BlokraTextOnly from '../assets/logo_text_blokra.svg';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: number;
  showText?: boolean;
}

/**
 * Blokra Logo Component
 * 
 * Features a dynamic, interactive 3D 'BK' icon that tilts based on mouse position,
 * with a static 'Blokra' text below it.
 */
export default function Logo({ 
  className = "", 
  iconSize = 64, // h-16 is 64px
  textSize = 24, // h-6 is 24px
  showText = true
}: LogoProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate normalized distance from center (-1 to 1)
      const x = (e.clientX - centerX) / (window.innerWidth / 2);
      const y = (e.clientY - centerY) / (window.innerHeight / 2);
      
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Minimalist Tilt: Max 5 degrees for a premium feel
  const rotateY = mousePos.x * 5;
  const rotateX = -mousePos.y * 5;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`} ref={containerRef}>
      <div 
        className="logo-icon-container transition-transform duration-700 ease-out will-change-transform"
        style={{ 
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        <img 
          src={BlokraIconBK} 
          alt="BK Icon" 
          style={{ height: `${iconSize}px`, width: 'auto' }}
          className="drop-shadow-[0_8px_16px_rgba(0,229,255,0.15)] select-none pointer-events-none" 
          referrerPolicy="no-referrer"
        />
      </div>
      
      {showText && (
        <div className="static-text-container">
          <img 
            src={BlokraTextOnly} 
            alt="Blokra" 
            style={{ height: `${textSize}px`, width: 'auto' }}
            className="static-text select-none pointer-events-none" 
            referrerPolicy="no-referrer"
          /> 
        </div>
      )}
    </div>
  );
}

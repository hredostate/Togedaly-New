
import React, { useEffect, useState } from 'react';
import { useTour } from './TourContext';

export const TourOverlay: React.FC = () => {
  const { currentStep, nextStep, skipTour, isActive, currentStepIndex } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });

  // 1. Monitor Window Size
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize(); // Initial set
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Active Element Tracking Loop
  useEffect(() => {
    if (!currentStep) return;

    let rafId: number;
    const trackElement = () => {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Update state only if changed significantly (prevents jitter loops)
        setTargetRect(prev => {
            if (!prev || 
                Math.abs(prev.top - rect.top) > 1 || 
                Math.abs(prev.left - rect.left) > 1 || 
                prev.width !== rect.width || 
                prev.height !== rect.height) {
                return rect;
            }
            return prev;
        });
      }
      rafId = requestAnimationFrame(trackElement);
    };

    // Initial scroll into view
    const element = document.getElementById(currentStep.targetId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    trackElement();
    return () => cancelAnimationFrame(rafId);
  }, [currentStep]);

  if (!isActive || !currentStep || !targetRect) return null;

  // --- POSITIONING LOGIC ---
  const TOOLTIP_WIDTH = 300; // Fixed width for predictability
  const GAP = 14;
  const MARGIN = 16; // Screen edge margin

  // Determine vertical position (Top vs Bottom)
  const spaceBelow = windowSize.h - targetRect.bottom;
  const spaceAbove = targetRect.top;
  
  // Prefer bottom, unless too tight (< 250px) and top has more space
  let finalPosition = 'bottom';
  if (spaceBelow < 250 && spaceAbove > spaceBelow) {
      finalPosition = 'top';
  }
  // Override if step explicitly requests it (and space permits)
  if (currentStep.position === 'top' && spaceAbove > 200) finalPosition = 'top';
  
  // Calculate Left (Center aligned, clamped to screen edges)
  let left = targetRect.left + (targetRect.width / 2) - (TOOLTIP_WIDTH / 2);
  left = Math.max(MARGIN, Math.min(left, windowSize.w - TOOLTIP_WIDTH - MARGIN));

  // Tooltip Style
  const tooltipStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 100002, // Higher than highlight
      width: `${TOOLTIP_WIDTH}px`,
      left: `${left}px`,
  };

  if (finalPosition === 'top') {
      tooltipStyle.bottom = windowSize.h - targetRect.top + GAP;
  } else {
      tooltipStyle.top = targetRect.bottom + GAP;
  }

  return (
    <div className="fixed inset-0 z-[100000] overflow-hidden pointer-events-none">
        {/* SVG Mask - Darkens everything except the target */}
        <div className="absolute inset-0 pointer-events-auto">
             <svg className="w-full h-full opacity-70">
                <defs>
                    <mask id="tour-mask" x="0" y="0" width="100%" height="100%">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect 
                            x={targetRect.left - 4} 
                            y={targetRect.top - 4} 
                            width={targetRect.width + 8} 
                            height={targetRect.height + 8} 
                            rx="12" 
                            fill="black" 
                        />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="#0f172a" mask="url(#tour-mask)" />
            </svg>
        </div>

        {/* Animated Highlight Border */}
        <div 
            className="absolute border-2 border-brand-400 rounded-xl pointer-events-none shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all duration-300 ease-out"
            style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                zIndex: 100001
            }}
        />

        {/* Tooltip Bubble */}
        <div 
            style={tooltipStyle} 
            className="bg-white rounded-2xl shadow-2xl border border-brand-100 p-0 overflow-hidden pointer-events-auto transition-all duration-300 ease-out animate-fade-in-up"
        >
            <div className="bg-brand-50 p-3 flex items-center gap-3 border-b border-brand-100">
                <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                    {currentStepIndex + 1}
                </div>
                <div className="font-bold text-brand-900 text-sm truncate pr-2">{currentStep.title}</div>
            </div>
            <div className="p-5">
                <p className="text-gray-700 text-sm leading-relaxed">{currentStep.content}</p>
                <div className="mt-5 flex justify-between items-center pt-2">
                    <button 
                        onClick={skipTour} 
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded hover:bg-slate-50 transition"
                    >
                        Dismiss
                    </button>
                    <button 
                        onClick={nextStep} 
                        className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand/20 transition-transform hover:-translate-y-0.5 active:scale-95"
                    >
                        {currentStepIndex === 0 ? 'Start Tour' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

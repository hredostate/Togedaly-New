
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';

export interface TourStep {
  targetId: string; // The ID of the element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  skipTour: () => void;
  currentStepIndex: number;
  currentStep: TourStep | null;
  isActive: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isActive, setIsActive] = useState(false);

  const startTour = (newSteps: TourStep[]) => {
    if (newSteps.length === 0) return;
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const skipTour = () => {
    endTour();
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStepIndex(-1);
    setSteps([]);
  };

  const currentStep = isActive && steps[currentStepIndex] ? steps[currentStepIndex] : null;

  return (
    <TourContext.Provider value={{ startTour, nextStep, skipTour, currentStepIndex, currentStep, isActive }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
};

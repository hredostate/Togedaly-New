
import React from 'react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({ children, className, ...props }) => {
    return (
        <button 
            className={`relative overflow-hidden group bg-slate-900 text-white font-bold transition-transform active:scale-95 ${className}`} 
            {...props}
        >
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
            <style>
                {`
                @keyframes shine {
                    100% { left: 125%; }
                }
                .group:hover .group-hover\\:animate-shine {
                    animation: shine 1s;
                }
                `}
            </style>
        </button>
    );
};

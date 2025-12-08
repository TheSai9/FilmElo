import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yellow' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Base: Bold font, thick border, hard shadow transition, press effect
  const baseStyles = "px-6 py-3 font-bold uppercase tracking-wider text-sm border-2 md:border-4 border-bauhaus-black transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-none disabled:active:shadow-hard-sm";
  
  const variants = {
    // Red (Primary Action)
    primary: "bg-bauhaus-red text-white shadow-hard-sm hover:shadow-hard-md hover:-translate-y-0.5",
    // Blue (Secondary Action)
    secondary: "bg-bauhaus-blue text-white shadow-hard-sm hover:shadow-hard-md hover:-translate-y-0.5",
    // Yellow (Emphasis)
    yellow: "bg-bauhaus-yellow text-bauhaus-black shadow-hard-sm hover:shadow-hard-md hover:-translate-y-0.5",
    // White/Outline
    outline: "bg-white text-bauhaus-black shadow-hard-sm hover:bg-gray-50 hover:shadow-hard-md",
    // Ghost (Minimal)
    ghost: "border-transparent shadow-none bg-transparent hover:bg-bauhaus-black/5 active:translate-none",
  };

  const widthClass = fullWidth ? 'w-full' : '';

  // Filter out border/shadow from ghost if needed, but keeping simple for now
  const finalClass = variant === 'ghost' 
    ? `px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors duration-200 hover:text-bauhaus-red ${widthClass} ${className}`
    : `${baseStyles} ${variants[variant]} ${widthClass} ${className}`;

  return (
    <button 
      className={finalClass} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-lb-dark";
  
  const variants = {
    primary: "bg-lb-green text-white hover:bg-green-500 focus:ring-lb-green shadow-lg shadow-green-900/20",
    secondary: "bg-lb-orange text-white hover:bg-orange-500 focus:ring-lb-orange shadow-lg shadow-orange-900/20",
    outline: "border-2 border-lb-gray text-lb-text hover:border-lb-green hover:text-white bg-transparent",
    ghost: "text-lb-text hover:text-white hover:bg-lb-gray/50",
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

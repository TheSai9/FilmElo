
import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, User as UserIcon, Loader2 } from 'lucide-react';

interface AuthButtonProps {
  user: User | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  isLoading?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ user, onLogin, onLogout, isLoading = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-bauhaus-black opacity-70 cursor-wait">
        <Loader2 size={16} className="animate-spin text-bauhaus-black" />
        <span className="text-xs font-bold uppercase tracking-widest">Connect</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 pl-3 pr-4 py-1.5 bg-white border-2 border-bauhaus-black hover:bg-gray-50 transition-colors shadow-hard-sm active:translate-y-[1px] active:shadow-none"
        >
          <div className="w-8 h-8 bg-bauhaus-blue text-white rounded-full border-2 border-bauhaus-black flex items-center justify-center font-black text-sm relative overflow-hidden">
             {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
             ) : (
                user.name.charAt(0).toUpperCase()
             )}
          </div>
          <div className="flex flex-col items-start leading-none hidden sm:flex">
             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Account</span>
             <span className="text-xs font-bold text-bauhaus-black max-w-[100px] truncate">{user.name}</span>
          </div>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-bauhaus-black shadow-hard-md z-20 animate-slide-up">
              <div className="p-3 border-b-2 border-bauhaus-black bg-gray-50">
                 <p className="text-xs font-bold text-bauhaus-black">{user.email}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-bauhaus-red hover:text-white transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={onLogin}
      className="group relative flex items-center gap-3 px-4 py-2 bg-white border-2 border-bauhaus-black hover:bg-blue-50 transition-all shadow-hard-sm hover:shadow-hard-md active:translate-y-[1px] active:shadow-none"
    >
       {/* Google "G" visual simulation */}
       <div className="w-5 h-5 flex items-center justify-center font-black text-lg font-sans text-bauhaus-blue group-hover:scale-110 transition-transform">
         G
       </div>
       <span className="text-sm font-bold uppercase tracking-wider text-bauhaus-black">
         Sign In
       </span>
    </button>
  );
};

export default AuthButton;

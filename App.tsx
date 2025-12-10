
import React, { useState, useEffect, useRef } from 'react';
import { Movie, AppView, User, SyncStatus } from './types';
import FileUpload from './components/FileUpload';
import VotingArena from './components/VotingArena';
import Leaderboard from './components/Leaderboard';
import { Film, Trash2, Cloud, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { STORAGE_KEY } from './constants';
import Button from './components/Button';
import AuthButton from './components/AuthButton';

// Mock Cloud Storage Key (In a real app, this would be your Firebase Firestore path)
const CLOUD_STORAGE_MOCK_KEY = 'cinerank_cloud_db_mock';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.UPLOAD);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Initialization ---
  
  useEffect(() => {
    // Try to restore user session (Simulation)
    const savedUser = localStorage.getItem('cinerank_user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Load Data
    loadLocalData();
    setIsInitialized(true);
  }, []);

  // --- 2. Data Management ---

  const loadLocalData = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMovies(parsed);
          setView(AppView.VOTE);
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  };

  const saveLocalData = (data: Movie[]) => {
    if (data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // --- 3. Cloud Simulation (Firebase Replacements) ---
  
  /**
   * INSTRUCTIONS FOR REAL FIREBASE INTEGRATION:
   * 1. Initialize Firebase App with your config.
   * 2. Replace handleLogin with `signInWithPopup(auth, provider)`.
   * 3. Replace saveToCloud with `setDoc(doc(db, 'users', user.id), { movies })`.
   * 4. Replace loadFromCloud with `getDoc(...)`.
   */

  const handleLogin = async () => {
    setAuthLoading(true);
    
    // Simulate Network Delay for "Google Sign In"
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create Mock User
    const mockUser: User = {
      id: 'google-user-123',
      name: 'Cinema Fan',
      email: 'fan@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' // Random avatar
    };

    setUser(mockUser);
    localStorage.setItem('cinerank_user_session', JSON.stringify(mockUser));
    setAuthLoading(false);

    // After login, sync cloud data
    await syncCloudData(mockUser);
  };

  const handleLogout = () => {
    if (window.confirm("Sign out? Your data is saved to your account.")) {
      setUser(null);
      localStorage.removeItem('cinerank_user_session');
      // Optionally clear local view or keep it. Let's keep it for UX continuity but clear "Cloud" status.
      setSyncStatus('idle');
    }
  };

  const syncCloudData = async (currentUser: User) => {
    setSyncStatus('syncing');
    
    // Simulate Fetch
    await new Promise(resolve => setTimeout(resolve, 800));

    // MOCK: Retrieve "Cloud" data from a separate local storage key to simulate a remote DB
    const cloudDataJson = localStorage.getItem(`${CLOUD_STORAGE_MOCK_KEY}_${currentUser.id}`);
    
    if (cloudDataJson) {
      try {
        const cloudMovies = JSON.parse(cloudDataJson);
        // Simple strategy: Cloud wins on login if it has data
        if (cloudMovies.length > 0) {
          setMovies(cloudMovies);
          saveLocalData(cloudMovies); // Sync local to match cloud
          if (view === AppView.UPLOAD) setView(AppView.VOTE);
        }
      } catch (e) {
        console.error("Cloud data corrupt", e);
      }
    } else if (movies.length > 0) {
      // First time sync: Push local to cloud
      saveToCloud(movies, currentUser);
    }
    
    setSyncStatus('saved');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const saveToCloud = (data: Movie[], currentUser: User) => {
    // MOCK: Save to separate storage key
    localStorage.setItem(`${CLOUD_STORAGE_MOCK_KEY}_${currentUser.id}`, JSON.stringify(data));
  };

  // --- 4. Reactive Updates ---

  useEffect(() => {
    if (!isInitialized) return;

    // 1. Always save to local device
    saveLocalData(movies);

    // 2. If logged in, debounce save to cloud
    if (user) {
      setSyncStatus('syncing');
      
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      
      syncTimeoutRef.current = setTimeout(() => {
        saveToCloud(movies, user);
        setSyncStatus('saved');
        
        // Hide "Saved" status after 2 seconds
        setTimeout(() => {
            setSyncStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 2000);
      }, 1000); // 1 second debounce
    }
  }, [movies, user, isInitialized]);


  // --- 5. Handlers ---

  const handleDataLoaded = (data: Movie[]) => {
    setMovies(data);
    setView(AppView.VOTE);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const msg = user 
      ? "Clear all data? This will also wipe your Cloud backup." 
      : "Are you sure? This will delete all your ranking progress and return you to the home page.";

    if (window.confirm(msg)) {
      setMovies([]);
      localStorage.removeItem(STORAGE_KEY);
      
      if (user) {
         // Wipe cloud data too
         localStorage.removeItem(`${CLOUD_STORAGE_MOCK_KEY}_${user.id}`);
      }
      
      setView(AppView.UPLOAD);
    }
  };

  const renderContent = () => {
    switch (view) {
      case AppView.UPLOAD:
        return <FileUpload onDataLoaded={handleDataLoaded} />;
      case AppView.VOTE:
        return (
          <VotingArena 
            movies={movies} 
            onUpdateMovies={setMovies} 
            onFinish={() => setView(AppView.LEADERBOARD)}
          />
        );
      case AppView.LEADERBOARD:
        return (
          <Leaderboard 
            movies={movies} 
            onBack={() => setView(AppView.VOTE)} 
          />
        );
      default:
        return <div>Error</div>;
    }
  };

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-text font-sans selection:bg-bauhaus-yellow selection:text-bauhaus-black flex flex-col">
      {/* Geometric Navbar */}
      <nav className="bg-white border-b-4 border-bauhaus-black sticky top-0 z-50 shadow-hard-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => movies.length > 0 && setView(AppView.VOTE)}
          >
            <div className="relative w-10 h-10 hidden sm:block">
                <div className="absolute inset-0 bg-bauhaus-blue border-2 border-bauhaus-black transition-transform group-hover:translate-x-1 group-hover:translate-y-1"></div>
                <div className="absolute inset-0 bg-bauhaus-red border-2 border-bauhaus-black -translate-x-1 -translate-y-1 flex items-center justify-center">
                    <Film size={20} className="text-white" strokeWidth={3} />
                </div>
            </div>
            
            <div className="flex flex-col leading-none">
              <span className="font-black text-xl md:text-2xl uppercase tracking-tighter text-bauhaus-black group-hover:text-bauhaus-red transition-colors">
                CineRank
              </span>
              <span className="font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] text-bauhaus-blue">
                Bauhaus
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {/* Sync Indicator */}
             {user && (
               <div className="hidden md:flex items-center gap-2 mr-2">
                 {syncStatus === 'syncing' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                      <RefreshCw size={12} className="animate-spin" /> Syncing
                    </span>
                 )}
                 {syncStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-bauhaus-green uppercase tracking-widest">
                      <Cloud size={12} /> Saved
                    </span>
                 )}
                 {syncStatus === 'error' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-bauhaus-red uppercase tracking-widest">
                      <AlertCircle size={12} /> Error
                    </span>
                 )}
               </div>
             )}

             {/* Auth Button */}
             <AuthButton 
                user={user} 
                onLogin={handleLogin} 
                onLogout={handleLogout}
                isLoading={authLoading}
             />

             {/* Separator */}
             {movies.length > 0 && <div className="w-[2px] h-8 bg-gray-200 mx-1"></div>}

             {/* Action Buttons */}
             {movies.length > 0 && (
               <>
                 <div className="hidden lg:flex items-center gap-2 px-4 py-1 bg-bauhaus-black text-white font-mono text-xs font-bold border-2 border-transparent">
                    <span className="text-bauhaus-yellow">●</span> {movies.length} FILMS
                 </div>
                 <button 
                    type="button"
                    onClick={handleReset}
                    className="relative z-10 p-2 text-bauhaus-black hover:text-bauhaus-red transition-colors cursor-pointer"
                    title="Reset Data"
                 >
                   <Trash2 size={20} />
                 </button>
               </>
             )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full animate-fade-in py-8">
        {renderContent()}
      </main>

      {/* Footer Decoration */}
      <footer className="border-t-4 border-bauhaus-black bg-bauhaus-yellow py-6 text-center">
        <p className="font-black uppercase tracking-widest text-xs opacity-70">
           Form Follows Function • 2025
        </p>
      </footer>
    </div>
  );
};

export default App;

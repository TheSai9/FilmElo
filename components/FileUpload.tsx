
import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Film, Star, Equal, X } from 'lucide-react';
import { Movie } from '../types';
import { INITIAL_ELO } from '../constants';
import Button from './Button';

interface FileUploadProps {
  onDataLoaded: (movies: Movie[]) => void;
}

type EloStrategy = 'fixed' | 'rating';

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eloStrategy, setEloStrategy] = useState<EloStrategy>('fixed');
  
  // State for multi-step upload flow
  const [pendingData, setPendingData] = useState<Movie[] | null>(null);
  const [showWatchedPrompt, setShowWatchedPrompt] = useState(false);

  // Helper: Parse Raw CSV text into objects
  const parseCSVRaw = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuote && nextChar === '"') {
          currentField += '"';
          i++; 
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuote) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
    
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  };

  const processFiles = async (files: FileList | File[], existingData: Movie[] = []) => {
    setLoading(true);
    setError(null);
    
    // We use a map to deduplicate by Name+Year. 
    // If we have existing data (from step 1), hydrate the map first.
    const movieMap = new Map<string, Partial<Movie>>();
    
    if (existingData.length > 0) {
        existingData.forEach(m => {
            const key = `${m.name.toLowerCase()}-${m.year}`;
            movieMap.set(key, {
                id: m.id,
                name: m.name,
                year: m.year,
                rating: m.rating,
                uri: m.uri,
                posterPath: m.posterPath
            });
        });
    }

    let filesProcessed = 0;
    let hasRatings = false;
    let isRatingsFileOnly = false;

    try {
      // Check if this is a single 'ratings' file upload (trigger for prompt)
      if (files.length === 1 && existingData.length === 0) {
         if (files[0].name.toLowerCase().includes('ratings')) {
             isRatingsFileOnly = true;
         }
      }

      // 1. Parse all files and merge into map
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const rows = parseCSVRaw(text);

        if (rows.length < 2) continue; // Skip empty files

        // Clean empty rows
        const cleanRows = rows.filter(r => r.length > 0 && (r.length > 1 || r[0] !== ''));
        if (cleanRows.length < 2) continue;

        const headerLine = cleanRows[0];
        const headers = headerLine.map(h => h.trim().toLowerCase());
        
        const nameIndex = headers.indexOf('name');
        const yearIndex = headers.indexOf('year');
        const ratingIndex = headers.indexOf('rating');
        const uriIndex = headers.indexOf('letterboxd uri');

        if (nameIndex === -1 || yearIndex === -1) {
          // Skip files that don't look like movie lists
          console.warn(`Skipping file ${file.name}: missing Name/Year headers`);
          continue;
        }
        
        filesProcessed++;

        for (let r = 1; r < cleanRows.length; r++) {
          const columns = cleanRows[r];
          if (columns.length <= Math.max(nameIndex, yearIndex)) continue;

          const name = columns[nameIndex]?.trim();
          const year = columns[yearIndex]?.trim();
          
          if (name && year) {
            const key = `${name.toLowerCase()}-${year}`;
            
            // Extract rating if available
            let ratingVal: number | undefined = undefined;
            if (ratingIndex > -1) {
                const parsed = parseFloat(columns[ratingIndex]);
                if (!isNaN(parsed) && parsed > 0) {
                    ratingVal = parsed;
                    hasRatings = true;
                }
            }

            const uri = uriIndex > -1 ? columns[uriIndex] : undefined;

            const existing = movieMap.get(key);
            
            // Merge logic: prioritize entry with rating or URI
            // If existing had a rating, keep it unless new one has rating
            // Actually, ratings.csv is usually definitive for rating.
            const finalRating = ratingVal || existing?.rating;

            movieMap.set(key, {
              id: existing?.id || `${name}-${year}-${r}`, // Keep existing ID if possible
              name: existing?.name || name,
              year: existing?.year || year,
              rating: finalRating,
              uri: uri || existing?.uri,
              posterPath: existing?.posterPath
            });
          }
        }
      }

      if (filesProcessed === 0) {
        throw new Error("No valid CSV files found. Headers must include 'Name' and 'Year'.");
      }

      // Check for Ratings requirement if this is the final step
      // If we are in the intermediate step (isRatingsFileOnly), we definitely have ratings
      if (eloStrategy === 'rating' && !hasRatings && existingData.length === 0 && !isRatingsFileOnly) {
         // However, if we are in existingData mode, we might be adding unrated movies, so hasRatings might be false for the *new* file
         // But existingData should have ratings.
         // Let's rely on the strategy check on the full dataset.
      }
      
      // If existingData was present, we check if the COMBINED set has ratings?
      // Actually, if existingData > 0, we assume we already passed the rating check.

      // 2. Convert to Movie array and apply ELO Strategy
      const movies: Movie[] = Array.from(movieMap.values()).map(m => {
        let initialElo = INITIAL_ELO;

        if (eloStrategy === 'rating' && m.rating) {
          // Map 0.5 - 5.0 stars to roughly 700 - 1600 Elo
          initialElo = 1200 + (m.rating - 3) * 200;
        }

        return {
          id: m.id!,
          name: m.name!,
          year: m.year!,
          rating: m.rating,
          uri: m.uri,
          posterPath: m.posterPath,
          elo: initialElo,
          matches: 0,
          wins: 0,
          losses: 0,
          history: []
        };
      });

      if (movies.length === 0) {
        throw new Error("No movies found in files.");
      }

      // 3. Prompt Logic
      if (eloStrategy === 'rating' && existingData.length === 0 && isRatingsFileOnly) {
          setPendingData(movies);
          setShowWatchedPrompt(true);
          setLoading(false);
          return;
      }

      // Final Check
      if (eloStrategy === 'rating' && !movies.some(m => m.rating)) {
          throw new Error("Star Power strategy selected but no ratings found. Please upload 'ratings.csv'.");
      }

      onDataLoaded(movies);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to parse CSV files.");
    } finally {
      if (!showWatchedPrompt) {
          setLoading(false);
      }
    }
  };

  const handleWatchedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && pendingData) {
      processFiles(e.target.files, pendingData);
      setShowWatchedPrompt(false);
      setPendingData(null);
    }
  };

  const skipWatchedUpload = () => {
    if (pendingData) {
        onDataLoaded(pendingData);
        setShowWatchedPrompt(false);
        setPendingData(null);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (showWatchedPrompt && pendingData) {
         // If prompt is open, dropping a file counts as the "watched.csv" upload
         processFiles(e.dataTransfer.files, pendingData);
         setShowWatchedPrompt(false);
         setPendingData(null);
      } else {
         processFiles(e.dataTransfer.files);
      }
    }
  }, [eloStrategy, showWatchedPrompt, pendingData]); 

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 pb-20">
      
      {/* Watched CSV Prompt Modal */}
      {showWatchedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bauhaus-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-md w-full border-4 border-bauhaus-black shadow-hard-xl p-8 text-center relative">
            <button 
                onClick={skipWatchedUpload}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100"
            >
                <X size={20} />
            </button>
            <div className="mx-auto w-16 h-16 bg-bauhaus-blue text-white flex items-center justify-center border-4 border-bauhaus-black mb-4 shadow-hard-sm">
                <Film size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase text-bauhaus-black mb-2">Complete the Picture?</h3>
            <p className="text-gray-600 font-medium mb-8 text-sm">
                You've loaded your <strong>Rated</strong> movies. <br/>
                Do you also want to upload <code>watched.csv</code> to include unrated diary entries?
            </p>
            
            <div className="flex flex-col gap-3">
                <input 
                    type="file" 
                    accept=".csv"
                    className="hidden"
                    id="watched-upload"
                    onChange={handleWatchedUpload}
                />
                <Button onClick={() => document.getElementById('watched-upload')?.click()} variant="primary" fullWidth>
                    Upload watched.csv
                </Button>
                <Button onClick={skipWatchedUpload} variant="ghost" fullWidth>
                    No, Use Rated Only
                </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-10 relative">
        {/* Geometric Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-4 border-bauhaus-black rotate-45 opacity-10"></div>
        
        <h2 className="text-5xl font-black uppercase tracking-tighter text-bauhaus-black mb-4">
          CineRank <span className="text-bauhaus-red">Elo</span>
        </h2>
        <p className="text-lg font-medium text-gray-600 max-w-md mx-auto">
          Upload your Letterboxd history to construct your definitive film hierarchy.
        </p>
      </div>

      {/* Configuration Section */}
      <div className="mb-10">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-bauhaus-black mb-4 flex items-center justify-center gap-2">
           <span className="w-8 h-1 bg-bauhaus-black"></span>
           Initialization Strategy
           <span className="w-8 h-1 bg-bauhaus-black"></span>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setEloStrategy('fixed')}
            className={`
              relative p-6 border-4 text-left transition-all duration-200 group
              ${eloStrategy === 'fixed' 
                ? 'border-bauhaus-black bg-bauhaus-black text-white shadow-hard-md translate-x-[2px] translate-y-[2px] shadow-none' 
                : 'border-bauhaus-black bg-white text-bauhaus-black shadow-hard-sm hover:shadow-hard-md hover:-translate-y-1'}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <Equal size={24} strokeWidth={3} className={eloStrategy === 'fixed' ? 'text-bauhaus-yellow' : 'text-bauhaus-black'} />
              <span className="font-black uppercase text-xl tracking-tight">Tabula Rasa</span>
            </div>
            <p className={`text-sm font-medium ${eloStrategy === 'fixed' ? 'text-gray-300' : 'text-gray-600'}`}>
              All films start equal (1200). Pure meritocracy based solely on your battles here.
            </p>
            {eloStrategy === 'fixed' && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-bauhaus-yellow rounded-full"></div>
            )}
          </button>

          <button
            onClick={() => setEloStrategy('rating')}
            className={`
              relative p-6 border-4 text-left transition-all duration-200 group
              ${eloStrategy === 'rating' 
                ? 'border-bauhaus-black bg-bauhaus-blue text-white shadow-hard-md translate-x-[2px] translate-y-[2px] shadow-none' 
                : 'border-bauhaus-black bg-white text-bauhaus-black shadow-hard-sm hover:shadow-hard-md hover:-translate-y-1'}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <Star size={24} strokeWidth={3} className={eloStrategy === 'rating' ? 'text-bauhaus-yellow' : 'text-bauhaus-black'} />
              <span className="font-black uppercase text-xl tracking-tight">Star Power</span>
            </div>
            <p className={`text-sm font-medium ${eloStrategy === 'rating' ? 'text-blue-200' : 'text-gray-600'}`}>
              Start based on Letterboxd ratings.
              <br/>
              <span className="text-xs font-mono opacity-80 mt-1 block">
                Requires <strong>ratings.csv</strong>
              </span>
            </p>
            {eloStrategy === 'rating' && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-bauhaus-yellow rounded-full"></div>
            )}
          </button>
        </div>
        
        {eloStrategy === 'rating' && (
           <div className="mt-4 p-4 bg-blue-50 border-l-4 border-bauhaus-blue text-sm text-bauhaus-blue font-bold animate-slide-up flex items-start gap-3 shadow-hard-sm">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>
                  For "Star Power", upload <code>ratings.csv</code> first. 
                  <span className="font-normal opacity-80 block mt-1">We'll ask if you want to add <code>watched.csv</code> afterwards to include unrated films.</span>
              </span>
           </div>
        )}
      </div>

      <div 
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative border-4 border-dashed rounded-none p-16 text-center transition-all cursor-pointer bg-white shadow-hard-lg
          ${isDragging ? 'border-bauhaus-blue bg-blue-50' : 'border-bauhaus-black hover:border-bauhaus-blue'}
        `}
      >
        <div className="flex flex-col items-center gap-6">
          <div className={`p-6 border-4 border-bauhaus-black shadow-hard-sm ${isDragging ? 'bg-bauhaus-blue text-white' : 'bg-bauhaus-yellow text-bauhaus-black'}`}>
            <Upload size={40} strokeWidth={3} />
          </div>
          <div>
            <p className="text-2xl font-black uppercase text-bauhaus-black">
                {eloStrategy === 'rating' ? 'Drop ratings.csv' : 'Drop CSV File'}
            </p>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-2">
               {eloStrategy === 'rating' ? '(Then watched.csv if prompted)' : 'watched.csv / diary.csv'}
            </p>
          </div>
          <input 
            type="file" 
            accept=".csv"
            multiple // Allow multiple files
            className="hidden"
            id="file-upload"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
          <Button 
            onClick={() => document.getElementById('file-upload')?.click()}
            variant="primary"
          >
            Select Files
          </Button>
        </div>
      </div>

      {loading && !showWatchedPrompt && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-bauhaus-black border-t-bauhaus-red rounded-full mb-2"></div>
          <p className="font-bold uppercase tracking-widest">Processing Cinema...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 p-6 bg-bauhaus-red text-white border-4 border-bauhaus-black shadow-hard-md flex items-center gap-4">
          <AlertCircle size={32} strokeWidth={3} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 border-4 border-bauhaus-black shadow-hard-sm">
          <h3 className="font-black uppercase text-bauhaus-blue flex items-center gap-2 mb-3 text-lg">
            <FileText size={20} /> Export Guide
          </h3>
          <ol className="list-decimal list-inside space-y-2 font-medium text-sm text-gray-700">
            <li>Open Letterboxd Settings</li>
            <li>Select "Import & Export"</li>
            <li>Download "Export Data" (Zip)</li>
            <li>Extract and use <code className="bg-gray-200 px-1 font-mono text-bauhaus-red">ratings.csv</code> or <code className="bg-gray-200 px-1 font-mono text-bauhaus-red">watched.csv</code></li>
          </ol>
        </div>
        <div className="bg-white p-6 border-4 border-bauhaus-black shadow-hard-sm">
          <h3 className="font-black uppercase text-bauhaus-yellow flex items-center gap-2 mb-3 text-lg">
            <AlertCircle size={20} /> Privacy First
          </h3>
          <p className="font-medium text-sm text-gray-700 leading-relaxed">
            Data stays in your browser. We process locally. Only AI requests (if used) are sent anonymously.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

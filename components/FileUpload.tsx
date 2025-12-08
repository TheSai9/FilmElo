import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Film } from 'lucide-react';
import { Movie } from '../types';
import { INITIAL_ELO } from '../constants';
import Button from './Button';

interface FileUploadProps {
  onDataLoaded: (movies: Movie[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  // ... (CSV Parsing Logic remains identical, omitted for brevity but assumed included in full file content) ...
  const parseCSV = (text: string): Movie[] => {
    const movies: Movie[] = [];
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

    if (rows.length < 2) throw new Error("File appears empty or invalid.");

    const cleanRows = rows.filter(r => r.length > 0 && (r.length > 1 || r[0] !== ''));
    if (cleanRows.length < 2) throw new Error("File appears empty or invalid.");

    const headerLine = cleanRows[0];
    const headers = headerLine.map(h => h.trim().toLowerCase());
    
    const nameIndex = headers.indexOf('name');
    const yearIndex = headers.indexOf('year');
    const ratingIndex = headers.indexOf('rating');
    const uriIndex = headers.indexOf('letterboxd uri');

    if (nameIndex === -1 || yearIndex === -1) {
      throw new Error("Missing required columns: 'Name' and 'Year'.");
    }

    for (let i = 1; i < cleanRows.length; i++) {
      const columns = cleanRows[i];
      if (columns.length <= Math.max(nameIndex, yearIndex)) continue;

      const name = columns[nameIndex]?.trim();
      const year = columns[yearIndex]?.trim();
      
      if (name && year) {
        movies.push({
          id: `${name}-${year}-${i}`,
          name: name,
          year: year,
          rating: ratingIndex > -1 ? parseFloat(columns[ratingIndex] || '0') : undefined,
          elo: INITIAL_ELO,
          matches: 0,
          wins: 0,
          losses: 0,
          uri: uriIndex > -1 ? columns[uriIndex] : undefined
        });
      }
    }
    return movies;
  };

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const parsedMovies = parseCSV(text);
      if (parsedMovies.length === 0) {
        setError("No valid movies found in CSV.");
      } else {
        onDataLoaded(parsedMovies);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to parse CSV.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      
      <div className="text-center mb-12 relative">
        {/* Geometric Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-4 border-bauhaus-black rotate-45 opacity-10"></div>
        
        <h2 className="text-5xl font-black uppercase tracking-tighter text-bauhaus-black mb-4">
          CineRank <span className="text-bauhaus-red">Elo</span>
        </h2>
        <p className="text-lg font-medium text-gray-600 max-w-md mx-auto">
          Upload your Letterboxd history to construct your definitive film hierarchy.
        </p>
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
            <p className="text-2xl font-black uppercase text-bauhaus-black">Drop CSV File</p>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-2">
              watched.csv / diary.csv
            </p>
          </div>
          <input 
            type="file" 
            accept=".csv"
            className="hidden"
            id="file-upload"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button 
            onClick={() => document.getElementById('file-upload')?.click()}
            variant="primary"
          >
            Select File
          </Button>
        </div>
      </div>

      {loading && (
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
            <li>Download "Export Data"</li>
            <li>Use <code className="bg-gray-200 px-1 font-mono text-bauhaus-red">watched.csv</code></li>
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
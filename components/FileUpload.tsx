import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
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

  const parseCSV = (text: string): Movie[] => {
    const movies: Movie[] = [];
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuote = false;

    // Robust CSV parsing state machine
    // Handles newlines inside quotes and escaped quotes correctly
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuote && nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        // End of field
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuote) {
        // End of row
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        
        // Handle CRLF
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
    
    // Handle last row if file doesn't end with newline
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    if (rows.length < 2) throw new Error("File appears empty or invalid.");

    // Filter out empty rows that might occur at end of file
    const cleanRows = rows.filter(r => r.length > 0 && (r.length > 1 || r[0] !== ''));
    
    if (cleanRows.length < 2) throw new Error("File appears empty or invalid.");

    const headerLine = cleanRows[0];
    const headers = headerLine.map(h => h.trim().toLowerCase());
    
    const nameIndex = headers.indexOf('name');
    const yearIndex = headers.indexOf('year');
    const ratingIndex = headers.indexOf('rating');
    const uriIndex = headers.indexOf('letterboxd uri');

    if (nameIndex === -1 || yearIndex === -1) {
      throw new Error("Missing required columns: 'Name' and 'Year'. Please use the 'watched.csv' or 'diary.csv' from Letterboxd.");
    }

    // Process rows
    for (let i = 1; i < cleanRows.length; i++) {
      const columns = cleanRows[i];
      // Skip rows that don't have enough columns for name/year
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
    <div className="max-w-xl mx-auto mt-10 p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Import Data</h2>
        <p className="text-lb-text">Upload your <code className="bg-lb-gray px-1 rounded text-lb-green">watched.csv</code> or <code className="bg-lb-gray px-1 rounded text-lb-green">diary.csv</code> from Letterboxd.</p>
      </div>

      <div 
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${isDragging ? 'border-lb-green bg-lb-green/10' : 'border-lb-gray hover:border-lb-text bg-lb-gray/20'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-lb-green text-white' : 'bg-lb-gray text-lb-text'}`}>
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-medium text-white">Drag and drop CSV file</p>
            <p className="text-sm text-lb-text mt-1">or click to browse</p>
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
            variant="outline"
          >
            Select File
          </Button>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center text-lb-green animate-pulse">
          Parsing your movie history...
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded flex items-center gap-3 text-red-200">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-lb-text">
        <div className="bg-lb-gray/20 p-4 rounded border border-lb-gray/30">
          <h3 className="font-bold text-white flex items-center gap-2 mb-2">
            <FileText size={16} /> How to export?
          </h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to Letterboxd Settings</li>
            <li>Click "Import & Export"</li>
            <li>Click "Export Data"</li>
            <li>Unzip and find <code>watched.csv</code></li>
          </ol>
        </div>
        <div className="bg-lb-gray/20 p-4 rounded border border-lb-gray/30">
          <h3 className="font-bold text-white flex items-center gap-2 mb-2">
            <AlertCircle size={16} /> Privacy Note
          </h3>
          <p>Your data is processed entirely in your browser. No movie data is sent to any server except for anonymous analysis requests if you enable AI features.</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
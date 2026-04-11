"use client";

import React from 'react';
import { Download, ExternalLink, FileText, ZoomIn } from 'lucide-react';

interface FilePreviewProps {
    path?: string;
    alt: string;
    className?: string;
}

/**
 * Checks if a file path points to a PDF document.
 */
const isPdf = (path?: string) => path?.toLowerCase().endsWith('.pdf');

/**
 * FilePreview Component
 * 
 * Provides a specialized preview based on file extension.
 * - PDFs are rendered via iframe with minimal UI.
 * - Images are rendered via img with hover effects.
 */
export const FilePreview = ({ path, alt, className }: FilePreviewProps) => {
    // 1. Handle Empty State
    if (!path) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 p-4 rounded-xl">
                <FileText className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-[10px] font-medium italic">Belum diunggah</span>
            </div>
        );
    }

    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'}/api/${path}`;

    // 2. Handle PDF Rendering
    if (isPdf(path)) {
        return (
            <div className={`relative group w-full h-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 ${className}`}>
                {/* PDF Viewer via Iframe */}
                <iframe 
                    src={`${fullUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full border-0 pointer-events-none"
                    title={alt}
                />
                
                {/* Interaction Overlay */}
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors pointer-events-none" />
                
                {/* Floating Action Bar */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                    <a 
                        href={fullUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                        title="Buka Penuh"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                {/* PDF Badge for UX */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded uppercase shadow-sm">
                    PDF DOC
                </div>
            </div>
        );
    }

    // 3. Handle Image Rendering
    return (
        <div className={`relative group w-full h-full overflow-hidden rounded-xl ${className}`}>
            <img 
                src={fullUrl} 
                alt={alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            {/* Image Overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* View Full Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                <a 
                    href={fullUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
};

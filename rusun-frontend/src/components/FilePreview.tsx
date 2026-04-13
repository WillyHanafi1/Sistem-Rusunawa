import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, ZoomIn, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface FilePreviewProps {
    path?: string;
    alt: string;
    className?: string;
}

const isPdf = (path?: string) => path?.toLowerCase().endsWith('.pdf');

export const FilePreview = ({ path, alt, className }: FilePreviewProps) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!path) {
            setBlobUrl(null);
            return;
        }

        let localUrl: string | null = null;

        const fetchFile = async () => {
            setIsLoading(true);
            setError(false);
            try {
                // Fetch via authenticated API to handle PII protection
                const response = await api.get(`/documents/${path}`, { 
                    responseType: 'blob' 
                });
                localUrl = URL.createObjectURL(response.data);
                setBlobUrl(localUrl);
            } catch (err) {
                console.error("Failed to fetch document preview:", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFile();

        return () => {
            if (localUrl) {
                URL.revokeObjectURL(localUrl);
            }
        };
    }, [path]);

    // 1. Handle Empty State
    if (!path) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 p-4 rounded-xl">
                <FileText className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-[10px] font-medium italic">Belum diunggah</span>
            </div>
        );
    }

    // 2. Handle Loading & Error States
    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
                <span className="text-[10px] text-slate-400">Loading dokumen...</span>
            </div>
        );
    }

    if (error || !blobUrl) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 p-4 rounded-xl text-rose-500">
                <AlertCircle className="w-6 h-6 mb-2" />
                <span className="text-[10px] font-medium text-center">Gagal memuat dokumen</span>
            </div>
        );
    }

    // 3. Handle PDF Rendering
    if (isPdf(path)) {
        return (
            <div className={`relative group w-full h-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 ${className}`}>
                <iframe 
                    src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0 pointer-events-none"
                    title={alt}
                />
                
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors pointer-events-none" />
                
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                    <a 
                        href={blobUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                        title="Buka Penuh"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded uppercase shadow-sm">
                    PDF DOC
                </div>
            </div>
        );
    }

    // 4. Handle Image Rendering
    return (
        <div className={`relative group w-full h-full overflow-hidden rounded-xl ${className}`}>
            <img 
                src={blobUrl} 
                alt={alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                <a 
                    href={blobUrl} 
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

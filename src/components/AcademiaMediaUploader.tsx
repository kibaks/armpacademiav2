import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Video, Music, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadFile, type AcademiaFile, type UploadOptions } from '../lib/academiaStorage';

type Props = {
  kind?: 'image' | 'video' | 'audio' | 'auto';
  category?: string;
  visibility?: 'private' | 'public';
  entityId?: string;
  accept?: string;
  maxSizeMo?: number;
  onUploaded: (file: AcademiaFile) => void;
  onError?: (msg: string) => void;
  label?: string;
  hint?: string;
  compact?: boolean;
};

export const AcademiaMediaUploader: React.FC<Props> = ({
  kind = 'auto',
  category,
  visibility,
  entityId,
  accept,
  maxSizeMo = 100,
  onUploaded,
  onError,
  label,
  hint,
  compact,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inferredAccept =
    accept ||
    (kind === 'image'
      ? 'image/jpeg,image/png,image/gif,image/webp'
      : kind === 'video'
      ? 'video/*'
      : kind === 'audio'
      ? 'audio/*'
      : 'image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar');

  const inferredLabel =
    label ||
    (kind === 'image' ? 'Importer une image' : kind === 'video' ? 'Importer une vidéo' : kind === 'audio' ? 'Importer un audio' : 'Importer un média');

  const inferredHint =
    hint || (kind === 'image' ? 'JPG, JPEG, PNG, GIF ou WebP — maximum 3 Mo' : `Glisser-déposer ou cliquer — Images, vidéos, audios → Academia 137.184.59.184 (max ${maxSizeMo} Mo)`);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      // Détermine catégorie/visibilité par défaut si non fourni
      let cat = category;
      let vis: 'private' | 'public' | undefined = visibility;
      if (!cat) {
        if (file.type.startsWith('image/')) {
          cat = 'images';
          vis = vis ?? 'public';
        } else if (file.type.startsWith('video/')) {
          cat = 'videos';
          vis = vis ?? 'private';
        } else if (file.type.startsWith('audio/')) {
          cat = 'audios';
          vis = vis ?? 'private';
        } else {
          cat = 'documents';
          vis = vis ?? 'private';
        }
      }
      const opts: UploadOptions = {
        category: cat,
        visibility: vis,
        entityId,
        onProgress: setProgress,
      };
      const res = await uploadFile(file, opts);
      onUploaded(res);
    } catch (e: any) {
      const msg = e?.message || 'Échec upload';
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition
        ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/50'}
        ${compact ? 'py-3' : ''} ${uploading ? 'pointer-events-none opacity-80' : ''}`}
    >
      <input ref={inputRef} type="file" accept={inferredAccept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Envoi vers Academia… {progress}%</span>
          <div className="w-full max-w-xs h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-slate-500">Stockage sécurisé 137.184.59.184</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-1.5">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</span>
          <span className="text-[11px] text-slate-500">Réessayez ou choisissez un autre fichier</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center justify-center gap-1.5">
            {kind === 'image' ? <ImageIcon className="w-5 h-5 text-emerald-500" /> : kind === 'video' ? <Video className="w-5 h-5 text-rose-500" /> : kind === 'audio' ? <Music className="w-5 h-5 text-purple-500" /> : <Upload className="w-5 h-5 text-blue-600" />}
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{inferredLabel}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md leading-tight">{inferredHint}</span>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
            Academia Storage • 100 Mo • Images/Vidéos/Audios
          </span>
        </div>
      )}
    </div>
  );
};

export const AcademiaMediaPreview: React.FC<{ file: AcademiaFile; onRemove?: () => void }> = ({ file, onRemove }) => {
  const isImg = file.mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extension);
  const isVid = file.mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(file.extension);
  const isAud = file.mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(file.extension);
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {isImg ? (
        <img src={file.url} alt={file.originalName} className="w-full max-h-64 object-cover" />
      ) : isVid ? (
        <video src={file.url} controls className="w-full max-h-64 bg-black" />
      ) : isAud ? (
        <div className="p-4 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
            <Music className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{file.originalName}</div>
            <audio controls src={file.url} className="w-full mt-1 h-8" />
          </div>
        </div>
      ) : (
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{file.originalName}</div>
            <div className="text-[11px] text-slate-500">
              {(file.size / 1024).toFixed(0)} Ko • {file.category} • {file.extension}
            </div>
          </div>
          <a href={file.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600">
            Ouvrir
          </a>
        </div>
      )}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Academia • {file.visibility}
      </div>
      {onRemove && (
        <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white">
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
        <span className="truncate">
          {file.originalName} • {(file.size / 1024 / 1024).toFixed(2)} Mo
        </span>
        <span className="font-mono text-[10px]">{file.id.slice(0, 8)}</span>
      </div>
    </div>
  );
};

import { useState, useCallback } from 'react';
import {
  uploadFile,
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadBlob,
  type AcademiaFile,
  type UploadOptions,
  MAX_SIZE_BYTES,
} from '../lib/academiaStorage';

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function useAcademiaUpload() {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<AcademiaFile | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setError(null);
    setLastFile(null);
  }, []);

  const upload = useCallback(
    async (file: File, opts: UploadOptions = {}): Promise<AcademiaFile> => {
      setState('uploading');
      setProgress(0);
      setError(null);
      try {
        if (file.size > MAX_SIZE_BYTES) throw new Error('Fichier > 100 Mo');
        const res = await uploadFile(file, {
          ...opts,
          onProgress: (p) => {
            setProgress(p);
            opts.onProgress?.(p);
          },
        });
        setLastFile(res);
        setState('success');
        setProgress(100);
        return res;
      } catch (e: any) {
        const msg = e?.message || 'Upload échoué';
        setError(msg);
        setState('error');
        throw e;
      }
    },
    []
  );

  const uploadAs = useCallback(
    async (file: File, kind: 'image' | 'video' | 'audio', opts: UploadOptions = {}) => {
      if (kind === 'image') return upload(file, { category: 'images', visibility: 'public', ...opts });
      if (kind === 'video') return upload(file, { category: 'videos', visibility: 'private', ...opts });
      return upload(file, { category: 'audios', visibility: 'private', ...opts });
    },
    [upload]
  );

  const uploadBlobAs = useCallback(
    async (blob: Blob, fileName: string, opts: UploadOptions = {}) => {
      setState('uploading');
      setProgress(0);
      setError(null);
      try {
        const res = await uploadBlob(blob, fileName, {
          ...opts,
          onProgress: (p) => {
            setProgress(p);
            opts.onProgress?.(p);
          },
        });
        setLastFile(res);
        setState('success');
        setProgress(100);
        return res;
      } catch (e: any) {
        const msg = e?.message || 'Upload blob échoué';
        setError(msg);
        setState('error');
        throw e;
      }
    },
    []
  );

  return {
    state,
    progress,
    error,
    lastFile,
    upload,
    uploadAs,
    uploadBlobAs,
    uploadImage: (f: File, o?: UploadOptions) => upload(f, { category: 'images', visibility: 'public', ...o }),
    uploadVideo: (f: File, o?: UploadOptions) => upload(f, { category: 'videos', visibility: 'private', ...o }),
    uploadAudio: (f: File, o?: UploadOptions) => upload(f, { category: 'audios', visibility: 'private', ...o }),
    reset,
    isUploading: state === 'uploading',
  };
}

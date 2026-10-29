// Keep protected recording URLs and transcripts in history; pending uploads
// remain in memory until the server returns their private playback URL.
export function tutorHistoryForStorage<T extends { media?: any }>(messages: T[]): T[] {
  return messages.slice(-40).map(message => message.media?.type === 'audio' && message.media.pendingUpload === true
    ? { ...message, media: { type: 'audio', name: message.media.name, duration: message.media.duration, transcriptText: message.media.transcriptText || '' } }
    : message);
}
export function tutorAudioMime(name: string, type: string) {
  const mime = type.split(';')[0].toLowerCase();
  if (mime.startsWith('audio/')) return type;
  const extension = name.split('.').pop()?.toLowerCase();
  return ({ mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'audio/mp4', wav: 'audio/wav', webm: 'audio/webm', weba: 'audio/webm', ogg: 'audio/ogg', opus: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' } as Record<string,string>)[extension || ''] || '';
}

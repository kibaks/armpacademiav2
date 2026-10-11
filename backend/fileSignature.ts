// Format signatures prevent renaming an HTML/script payload as published media.
// This is format validation, not a malware scanner.
export function validFileSignature(bytes: Buffer, extension: string): boolean {
  const starts = (text: string) => bytes.subarray(0, text.length).toString('ascii') === text;
  switch (extension) {
    case 'pdf': return starts('%PDF-');
    case 'png': return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    case 'jpg': case 'jpeg': return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    case 'gif': return starts('GIF87a') || starts('GIF89a');
    case 'webp': return starts('RIFF') && bytes.subarray(8,12).toString('ascii') === 'WEBP';
    case 'wav': return starts('RIFF') && bytes.subarray(8,12).toString('ascii') === 'WAVE';
    case 'mp4': case 'mov': case 'm4a': return bytes.subarray(4,8).toString('ascii') === 'ftyp';
    case 'webm': return bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
    case 'mp3': return starts('ID3') || (bytes[0] === 255 && (bytes[1] & 0xe0) === 0xe0);
    case 'ogg': return starts('OggS');
    case 'flac': return starts('fLaC');
    case 'zip': case 'docx': case 'xlsx': case 'pptx': return bytes[0] === 0x50 && bytes[1] === 0x4b;
    case 'doc': case 'xls': case 'ppt': return bytes.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
    case 'txt': case 'csv': case 'json': return !bytes.includes(0);
    default: return false;
  }
}

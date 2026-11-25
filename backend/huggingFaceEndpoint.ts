/** Only the configured private endpoint or the owner's named private Space. */
export function trustedHuggingFaceEndpoint(url: URL) {
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash &&
    (url.hostname.endsWith('.endpoints.huggingface.cloud') || url.hostname === 'kibaks-academia-engine-build.hf.space');
}

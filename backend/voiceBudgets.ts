export type VoiceProvider = 'elevenlabs' | 'gemini';
export class VoiceBudgets {
  private blocked = new Map<VoiceProvider, number>();
  private reason = new Map<VoiceProvider, string>();
  private quota: { used: number | null; limit: number | null; resetAt: number | null; readable: boolean } = { used: null, limit: null, resetAt: null, readable: false };
  private checkedAt = 0;
  private reading: Promise<void> | null = null;
  private reserved = 0;
  private geminiTokensObserved = 0;
  constructor(private clock: () => number = Date.now) {}
  available(provider: VoiceProvider) { return (this.blocked.get(provider) || 0) <= this.clock(); }
  fail(provider: VoiceProvider, status: number, retryAfter?: string | null, detail?: string) {
    let wait = status === 429 ? 60000 : status === 401 || status === 403 ? 300000 : 20000;
    if (status === 402 || /quota_exceeded|resource_exhausted|insufficient_credits/i.test(detail || '')) wait = 300000;
    if (retryAfter) {
      const seconds = Number(retryAfter);
      const duration = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - this.clock();
      if (Number.isFinite(duration) && duration > 0) wait = Math.max(1000, Math.min(duration, 3600000));
    }
    this.blocked.set(provider, this.clock() + wait);
    this.reason.set(provider, status === 429 || status === 402 || /quota|exhausted|credits/i.test(detail || '') ? 'quota' : status === 401 || status === 403 ? 'permission' : 'unavailable');
  }
  async readElevenQuota(apiKey: string, fetcher: typeof fetch = fetch) {
    if (this.checkedAt && this.clock() - this.checkedAt < 60000) return;
    if (this.reading) return this.reading;
    this.reading = (async () => {
      try {
        const response = await fetcher('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': apiKey }, signal: AbortSignal.timeout(4000) });
        if (response.ok) {
          const data = await response.json();
          const used = Number(data.character_count), limit = Number(data.character_limit);
          if (Number.isFinite(used) && Number.isFinite(limit) && used >= 0 && limit >= 0) this.quota = { used, limit, resetAt: Number(data.next_character_count_reset_unix) * 1000 || null, readable: true };
        } else this.quota.readable = false;
      } catch { this.quota.readable = false; }
      finally { this.checkedAt = this.clock(); this.reading = null; }
    })();
    return this.reading;
  }
  reserveEleven(chars: number) {
    if (!this.available('elevenlabs')) return false;
    if (this.quota.readable && this.quota.used !== null && this.quota.limit !== null && this.quota.used + this.reserved + chars > this.quota.limit) return false;
    this.reserved += chars; return true;
  }
  releaseEleven(chars: number, success: boolean) {
    this.reserved = Math.max(0, this.reserved - chars);
    if (success && this.quota.used !== null) this.quota.used += chars;
  }
  recordGeminiUsage(tokens: unknown) { if (typeof tokens === 'number' && Number.isFinite(tokens) && tokens >= 0) this.geminiTokensObserved += tokens; }
  snapshot() {
    return {
      elevenlabs: { quotaReadable: this.quota.readable, remainingCharacters: this.quota.readable && this.quota.limit !== null && this.quota.used !== null ? Math.max(0, this.quota.limit - this.quota.used - this.reserved) : null, checkedAt: this.checkedAt || null, retryAt: this.available('elevenlabs') ? null : this.blocked.get('elevenlabs'), reason: this.available('elevenlabs') ? null : this.reason.get('elevenlabs') },
      gemini: { remainingTokens: null, observedTokensThisInstance: this.geminiTokensObserved, retryAt: this.available('gemini') ? null : this.blocked.get('gemini'), reason: this.available('gemini') ? null : this.reason.get('gemini') },
    };
  }
}
export const voiceBudgets = new VoiceBudgets();

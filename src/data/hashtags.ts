/** hashtags.ts — hashtag produk (murni). Input bebas dari CMS → daftar "#Tag" yang rapi. */
export function readHashtags(value: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of String(value ?? '').split(/[\s,;#]+/)) {
    const tag = raw.replace(/[^\p{L}\p{N}_]/gu, '');
    if (!tag || seen.has(tag.toLowerCase())) continue;
    if (tag.length > 40) throw new Error('Satu hashtag maksimal 40 karakter.');
    seen.add(tag.toLowerCase());
    out.push(`#${tag}`);
  }
  if (out.length > 15) throw new Error('Maksimal 15 hashtag per produk.');
  return out;
}

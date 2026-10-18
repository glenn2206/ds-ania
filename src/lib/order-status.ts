export const orderStatuses = ['pending', 'paid', 'fulfilled', 'expired', 'cancelled', 'failed', 'refund_requested'] as const;
export function orderStatusLabel(status: string) { return status === 'refund_requested' ? 'Refund diminta' : status === 'refunded' ? 'Refund berhasil' : status; }
export function customerWhatsApp(phone: string, code: string): string | undefined {
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  if (!/^\d{8,15}$/.test(digits)) return undefined;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Halo, kami dari ANIA Flower Boutique ingin mengonfirmasi order ${code}.`)}`;
}

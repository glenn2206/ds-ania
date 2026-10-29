export function isInstantService(courier: unknown, service: unknown): boolean {
  return (courier === 'grab' || courier === 'gojek') && service === 'instant';
}

export function deliveryToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

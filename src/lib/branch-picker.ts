import { activeBranch, resolveBranch, type BranchPin } from '../data/checkout-branches';

// Local distance selection. Changing branches never calls the shipping API.
export function initBranchPicker(root: HTMLElement, initial: { mode: string; destination?: BranchPin; branchChoice?: string; pickupBranchId?: string }, changed: () => void) {
  const select = root.querySelector<HTMLSelectElement>('[data-pickup-branch]')!;
  const status = root.querySelector<HTMLElement>('[data-branch-status]')!;
  const link = root.querySelector<HTMLAnchorElement>('[data-branch-map]')!;
  const label = root.querySelector<HTMLElement>('[data-branch-label]')!;
  let mode = initial.mode;
  let pin = initial.destination;
  const valid = (id?: string) => { try { return activeBranch(id).id; } catch { return undefined; } };
  let deliveryChoice = valid(initial.branchChoice) || 'auto';
  let pickupChoice = valid(initial.pickupBranchId) || 'jakarta';
  const current = () => {
    try { return resolveBranch(mode === 'pickup' ? pickupChoice : deliveryChoice, pin); } catch { return undefined; }
  };
  const render = () => {
    const pickup = mode === 'pickup';
    const auto = select.querySelector<HTMLOptionElement>('option[value="auto"]')!;
    auto.hidden = pickup; auto.disabled = pickup;
    select.value = pickup ? pickupChoice : deliveryChoice;
    label.textContent = pickup ? 'Pickup branch' : 'Dispatch branch';
    const branch = current();
    status.textContent = branch ? `${!pickup && deliveryChoice === 'auto' ? 'Nearest active branch: ' : ''}${branch.name}. ${branch.address}` : 'Choose your delivery pin to suggest the nearest active branch. You can also select a branch manually.';
    link.hidden = !branch;
    if (branch) link.href = branch.mapsUrl;
    const picker = root.querySelector<HTMLElement>('[data-pin-picker]');
    if (picker && branch) { picker.dataset.originLat = String(branch.latitude); picker.dataset.originLng = String(branch.longitude); }
  };
  select.addEventListener('change', () => {
    if (mode === 'pickup') pickupChoice = valid(select.value) || 'jakarta';
    else deliveryChoice = valid(select.value) || 'auto';
    render(); changed();
  });
  render();
  return { current, setMode(value: string) { mode = value; render(); }, setDestination(value?: BranchPin) { pin = value; render(); },
    draft: () => ({ branchChoice: deliveryChoice, pickupBranchId: pickupChoice }) };
}

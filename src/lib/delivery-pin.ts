import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { requestCurrentLocation } from './current-location';

export interface DeliveryPin { latitude: number; longitude: number }
export interface DeliveryDestination { destination?: DeliveryPin; label?: string; areaId?: string; postal?: number; cityLabel?: string; districtLabel?: string }

export function initDeliveryPin(root: HTMLElement, onChange: (value: DeliveryDestination) => void, initial: DeliveryDestination = {}) {
  const open = root.querySelector<HTMLButtonElement>('[data-pin-open]')!;
  const panel = root.querySelector<HTMLElement>('[data-pin-panel]')!;
  const canvas = root.querySelector<HTMLElement>('[data-pin-map]')!;
  const confirm = root.querySelector<HTMLButtonElement>('[data-pin-confirm]')!;
  const cancel = root.querySelector<HTMLButtonElement>('[data-pin-cancel]')!;
  const result = root.querySelector<HTMLElement>('[data-pin-result]')!;
  const coordinateInput = root.querySelector<HTMLInputElement>('[data-pin-coordinates]')!;
  const locate = root.querySelector<HTMLButtonElement>('[data-pin-locate]')!;
  const currentLocation = root.querySelector<HTMLButtonElement>('[data-pin-current]')!;
  const locationStatus = root.querySelector<HTMLElement>('[data-pin-location-status]')!;
  let locationRequest = 0;
  let selected = initial.destination && Number.isFinite(initial.destination.latitude) && Number.isFinite(initial.destination.longitude)
    ? initial.destination : undefined;
  let map: LeafletMap | undefined;
  let opening = false;
  const render = () => {
    result.textContent = selected ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}` : '';
    open.textContent = selected ? 'Change delivery pin' : 'Choose delivery pin';
  };
  const stopLocating = () => {
    locationRequest++;
    currentLocation.disabled = false;
    currentLocation.removeAttribute('aria-busy');
    locationStatus.textContent = '';
  };
  const close = () => { stopLocating(); panel.hidden = true; open.setAttribute('aria-expanded', 'false'); open.focus(); };
  open.addEventListener('click', async () => {
    if (opening) return;
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    open.setAttribute('aria-expanded', 'true');
    opening = true;
    try {
      if (!map) {
        const L = await import('leaflet');
        map = L.map(canvas, { scrollWheelZoom: false }).setView(
          selected ? [selected.latitude, selected.longitude] : [Number(root.dataset.originLat), Number(root.dataset.originLng)], selected ? 17 : 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        map.on('moveend', () => { confirm.disabled = false; });
        map.on('click', (event) => { map!.panTo(event.latlng); confirm.disabled = false; });
      }
      map.invalidateSize();
      if (selected) { map.setView([selected.latitude, selected.longitude], 17); confirm.disabled = false; }
    } catch { result.textContent = 'Map unavailable. Please try again later.'; }
    finally { opening = false; }
  });
  currentLocation.addEventListener('click', async () => {
    if (!map || currentLocation.disabled) return;
    const request = ++locationRequest;
    currentLocation.disabled = true;
    currentLocation.setAttribute('aria-busy', 'true');
    locationStatus.textContent = 'Finding your location...';
    try {
      const position = await requestCurrentLocation(navigator.geolocation, window.isSecureContext);
      if (request !== locationRequest || panel.hidden) return;
      map.setView([position.latitude, position.longitude], 17);
      coordinateInput.value = `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
      coordinateInput.setCustomValidity('');
      confirm.disabled = false;
      locationStatus.textContent = 'Location found. Confirm the delivery pin on the map.';
    } catch (error) {
      if (request !== locationRequest || panel.hidden) return;
      locationStatus.textContent = error instanceof Error ? error.message : 'Location could not be found. Choose a pin manually.';
    } finally {
      if (request === locationRequest) {
        currentLocation.disabled = false;
        currentLocation.removeAttribute('aria-busy');
      }
    }
  });
  locate.addEventListener('click', () => {
    stopLocating();
    const pair = coordinateInput.value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (!pair || Math.abs(Number(pair[1])) > 90 || Math.abs(Number(pair[2])) > 180) {
      coordinateInput.setCustomValidity('Enter a valid latitude, longitude pair.');
      coordinateInput.reportValidity(); return;
    }
    coordinateInput.setCustomValidity('');
    map?.setView([Number(pair[1]), Number(pair[2])], 17);
    confirm.disabled = !map;
  });
  coordinateInput.addEventListener('input', () => coordinateInput.setCustomValidity(''));
  confirm.addEventListener('click', () => {
    if (!map) return;
    const center = map.wrapLatLng(map.getCenter());
    selected = { latitude: Number(center.lat.toFixed(6)), longitude: Number(center.lng.toFixed(6)) };
    onChange({ destination: selected, label: 'Delivery pin' });
    render(); close();
  });
  cancel.addEventListener('click', close);
  render();
}

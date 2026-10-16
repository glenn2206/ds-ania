import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { requestCurrentLocation } from './current-location';
import { parseDeliveryCoordinates } from './delivery-coordinates';
import type { AddressMatch } from './address-search';

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
  const address = root.closest('[data-delivery]')?.querySelector<HTMLTextAreaElement>('[data-sendto]');
  const searchInput = root.querySelector<HTMLInputElement>('[data-address-query]')!;
  const searchButton = root.querySelector<HTMLButtonElement>('[data-address-search]')!;
  const searchStatus = root.querySelector<HTMLElement>('[data-address-status]')!;
  const searchResults = root.querySelector<HTMLElement>('[data-address-results]')!;
  const searchContainer = root.querySelector<HTMLElement>('[data-address-container]')!;
  let activeOption = -1;
  const showResults = (show: boolean) => {
    searchResults.hidden = !show;
    searchInput.setAttribute('aria-expanded', String(show));
    activeOption = -1;
    searchInput.removeAttribute('aria-activedescendant');
    searchResults.querySelectorAll('[aria-selected]').forEach(option => option.setAttribute('aria-selected', 'false'));
  };
  let searchRequest = 0;
  let searchAbort: AbortController | undefined;
  const clearSearch = () => {
    searchRequest++; searchAbort?.abort(); searchButton.disabled = false;
    searchResults.replaceChildren(); showResults(false); searchStatus.textContent = '';
  };
  let locationRequest = 0;
  let selected = initial.destination && Number.isFinite(initial.destination.latitude) && Number.isFinite(initial.destination.longitude)
    ? initial.destination : undefined;
  let map: LeafletMap | undefined;
  let opening = false;
  let applyingCoordinates = false;
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
  const close = () => { stopLocating(); clearSearch(); panel.hidden = true; open.setAttribute('aria-expanded', 'false'); open.focus(); };
  open.addEventListener('click', async () => {
    if (opening) return;
    if (!panel.hidden) { close(); return; }
    if (address && !address.value.trim()) {
      address.setCustomValidity('Enter the full delivery address before choosing a pin.');
      address.reportValidity(); address.focus(); return;
    }
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
        map.on('moveend', () => {
          const center = map!.wrapLatLng(map!.getCenter());
          if (!applyingCoordinates) coordinateInput.value = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
          coordinateInput.setCustomValidity(''); confirm.disabled = false;
        });
        map.on('click', (event) => { map!.panTo(event.latlng, { animate: false }); confirm.disabled = false; });
      }
      map.invalidateSize();
      map.setView(selected ? [selected.latitude, selected.longitude] : [Number(root.dataset.originLat), Number(root.dataset.originLng)], selected ? 17 : 12);
      const center = map.wrapLatLng(map.getCenter());
      coordinateInput.value = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
      coordinateInput.setCustomValidity(''); confirm.disabled = false;
    } catch (error) {
      console.error('Delivery map could not be opened:', error);
      result.textContent = 'Map unavailable. Please try again later.';
    }
    finally { opening = false; }
  });
  currentLocation.addEventListener('click', async () => {
    if (!map || currentLocation.disabled) return;
    clearSearch();
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
  const applyCoordinates = (report = false) => {
    stopLocating();
    const point = parseDeliveryCoordinates(coordinateInput.value);
    if (!point) {
      coordinateInput.setCustomValidity('Enter a valid latitude, longitude pair.');
      confirm.disabled = true;
      if (report) coordinateInput.reportValidity();
      return false;
    }
    coordinateInput.setCustomValidity('');
    applyingCoordinates = true;
    try { map?.setView([point.latitude, point.longitude], 17, { animate: false }); }
    finally { applyingCoordinates = false; }
    confirm.disabled = !map;
    return Boolean(map);
  };
  locate.addEventListener('click', () => { applyCoordinates(true); });
  const searchAddress = async () => {
    const q = searchInput.value.trim();
    if (q.length < 4 || q.length > 160) {
      searchInput.setCustomValidity('Enter a street or place and city (4-160 characters).');
      searchInput.reportValidity(); return;
    }
    clearSearch();
    const request = ++searchRequest;
    searchAbort = new AbortController();
    searchButton.disabled = true; searchStatus.textContent = 'Searching addresses...';
    try {
      const response = await fetch('/api/address-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }), signal: searchAbort.signal });
      const data = await response.json();
      if (request !== searchRequest || panel.hidden) return;
      if (!response.ok || !Array.isArray(data.matches)) throw new Error('Search unavailable');
      const matches: AddressMatch[] = data.matches;
      searchStatus.textContent = matches.length ? 'Select a result, then confirm the exact delivery pin.' : 'No address found. Try a nearby street or place, or choose a pin manually.';
      for (const match of matches) {
        const item = document.createElement('li');
        item.setAttribute('role', 'presentation');
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = match.label;
        button.id = `${searchResults.id}-option-${searchResults.children.length}`;
        button.setAttribute('role', 'option'); button.setAttribute('aria-selected', 'false'); button.tabIndex = -1;
        button.addEventListener('click', () => {
          stopLocating();
          // Choosing a search result invalidates any previously confirmed quote/pin.
          selected = undefined; render(); onChange({});
          coordinateInput.value = `${match.latitude}, ${match.longitude}`;
          if (!applyCoordinates()) return;
          searchInput.value = match.label;
          searchResults.replaceChildren(); showResults(false);
          searchStatus.textContent = 'Address found. Adjust the pin if needed, then use this pin.';
          confirm.focus();
        });
        item.append(button); searchResults.append(item);
      }
      showResults(matches.length > 0);
    } catch {
      if (request === searchRequest && !panel.hidden) searchStatus.textContent = 'Address search unavailable. Try again later or choose a pin manually.';
    } finally { if (request === searchRequest) searchButton.disabled = false; }
  };
  searchButton.addEventListener('click', searchAddress);
  searchInput.addEventListener('input', () => { searchInput.setCustomValidity(''); clearSearch(); });
  searchInput.addEventListener('keydown', event => {
    const options = [...searchResults.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
      event.preventDefault();
      if (searchResults.hidden) showResults(true);
      activeOption = activeOption < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1)
        : (activeOption + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options.forEach((option, index) => option.setAttribute('aria-selected', String(index === activeOption)));
      searchInput.setAttribute('aria-activedescendant', options[activeOption].id);
      options[activeOption].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Escape') {
      event.preventDefault(); clearSearch();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!searchResults.hidden && activeOption >= 0) options[activeOption]?.click();
      else if (!searchButton.disabled) void searchAddress();
    }
  });
  root.addEventListener('focusout', event => {
    if (!searchContainer.contains(event.relatedTarget as Node | null)) showResults(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!searchContainer.contains(event.target as Node)) showResults(false);
  });
  coordinateInput.addEventListener('input', () => { applyCoordinates(); });
  coordinateInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault(); applyCoordinates(true);
  });
  confirm.addEventListener('click', () => {
    if (!map || !applyCoordinates(true)) return;
    const center = map.wrapLatLng(map.getCenter());
    selected = { latitude: Number(center.lat.toFixed(6)), longitude: Number(center.lng.toFixed(6)) };
    onChange({ destination: selected, label: 'Delivery pin' });
    render(); close();
  });
  cancel.addEventListener('click', close);
  address?.addEventListener('input', () => {
    address.setCustomValidity('');
    clearSearch();
    if (!selected) return;
    selected = undefined;
    stopLocating(); panel.hidden = true; open.setAttribute('aria-expanded', 'false');
    render(); onChange({});
  });
  render();
}

export interface DeliveryArea {
  id: string;
  name: string;
  postal_code: number;
  administrative_division_level_1_name?: string;
  administrative_division_level_2_name?: string;
  administrative_division_level_3_name?: string;
  administrative_division_level_4_name?: string;
}
export interface DeliveryDestination {
  areaId?: string;
  postal?: number;
  label?: string;
  cityLabel?: string;
  districtLabel?: string;
}
export const cityName = (area: DeliveryArea) => area.administrative_division_level_2_name || '';
export const districtName = (area: DeliveryArea) => [
  area.administrative_division_level_3_name,
  area.administrative_division_level_4_name,
].filter(Boolean).join(', ') || area.name;

export function initAreaPicker(root: HTMLElement, onChange: (destination: DeliveryDestination) => void, initial: DeliveryDestination = {}) {
  const city = root.querySelector<HTMLInputElement>('[data-area-city]')!;
  const district = root.querySelector<HTMLInputElement>('[data-addr]')!;
  const cities = root.querySelector<HTMLElement>('[data-area-cities]')!;
  const districts = root.querySelector<HTMLElement>('[data-addrlist]')!;
  const status = root.querySelector<HTMLElement>('[data-area-status]')!;
  let selectedCity = initial.cityLabel || '';
  let areas: DeliveryArea[] = [];
  let revision = 0;
  let timer: number | undefined;
  city.value = selectedCity;
  district.value = initial.districtLabel || initial.label || '';
  district.disabled = !selectedCity;
  if (selectedCity) district.placeholder = 'Search district / subdistrict';
  const close = () => {
    cities.hidden = districts.hidden = true;
    city.setAttribute('aria-expanded', 'false');
    district.setAttribute('aria-expanded', 'false');
  };
  const message = (text: string) => { status.textContent = text; status.hidden = !text; };
  const show = (input: HTMLInputElement, list: HTMLElement, choices: { label: string; select: () => void }[]) => {
    list.replaceChildren();
    for (const choice of choices.slice(0, 30)) {
      const option = document.createElement('li');
      option.textContent = choice.label;
      option.setAttribute('role', 'option');
      option.tabIndex = -1;
      const select = () => { choice.select(); input.focus(); close(); message(''); };
      option.addEventListener('click', select);
      option.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
        if (event.key === 'ArrowDown') { event.preventDefault(); (option.nextElementSibling as HTMLElement)?.focus(); }
        if (event.key === 'ArrowUp') { event.preventDefault(); (option.previousElementSibling as HTMLElement)?.focus(); }
        if (event.key === 'Escape') { close(); input.focus(); }
      });
      list.append(option);
    }
    list.hidden = !choices.length;
    input.setAttribute('aria-expanded', String(choices.length > 0));
    message(choices.length ? '' : 'No matching locations. Try another search.');
  };
  const search = async (query: string): Promise<DeliveryArea[]> => {
    const response = await fetch('/api/shipping?q=' + encodeURIComponent(query));
    if (!response.ok) throw new Error('Address search is unavailable. Please try again.');
    const data = await response.json();
    return Array.isArray(data.areas) ? data.areas : [];
  };
  const showDistricts = (query = '') => {
    const options = areas.filter((area) => cityName(area) === selectedCity && districtName(area).toLowerCase().includes(query.toLowerCase()));
    show(district, districts, options.map((area) => ({
      label: `${districtName(area)} (${area.postal_code})`,
      select: () => {
        district.value = districtName(area);
        onChange({ areaId: area.id, postal: area.postal_code, label: area.name, cityLabel: selectedCity, districtLabel: districtName(area) });
      },
    })));
  };
  const schedule = (input: HTMLInputElement, isCity: boolean) => {
    const request = ++revision;
    window.clearTimeout(timer);
    close();
    if (isCity) {
      selectedCity = '';
      district.value = '';
      district.disabled = true;
      district.placeholder = 'Select a city first';
    }
    onChange({ cityLabel: selectedCity });
    const query = input.value.trim();
    if (isCity && query.length < 3) { message('Type at least 3 characters to search.'); return; }
    message('Searching locations...');
    timer = window.setTimeout(async () => {
      try {
        const result = await search(query.length >= 3 ? query : selectedCity);
        if (request !== revision) return;
        areas = result;
        if (!isCity) { showDistricts(query); return; }
        const names = [...new Set(result.map(cityName).filter(Boolean))];
        show(city, cities, names.map((name) => ({ label: name, select: () => {
          selectedCity = city.value = name;
          district.disabled = false;
          district.placeholder = 'Search district / subdistrict';
          onChange({ cityLabel: name });
        } })));
      } catch (error) { if (request === revision) message((error as Error).message); }
    }, 300);
  };
  city.addEventListener('input', () => schedule(city, true));
  district.addEventListener('input', () => schedule(district, false));
  district.addEventListener('focus', () => {
    if (areas.length) showDistricts(district.value);
    else if (selectedCity) schedule(district, false);
  });
  for (const [input, list] of [[city, cities], [district, districts]] as const) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && !list.hidden) { event.preventDefault(); (list.firstElementChild as HTMLElement)?.focus(); }
      if (event.key === 'Escape') { revision++; close(); message(''); }
    });
  }
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) { revision++; window.clearTimeout(timer); close(); message(''); }
  });
}

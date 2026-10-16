import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { parseAddressMatches, searchAddresses } from '../src/lib/address-search';

const feature = (coords: unknown[] = [106.8167, -6.2], countrycode = 'ID') => ({
  geometry: { type: 'Point', coordinates: coords },
  properties: { name: 'Jalan Sudirman', city: 'Jakarta', countrycode },
});

test('address matches validate GeoJSON, Indonesian coordinates and deduplicate', () => {
  assert.deepEqual(parseAddressMatches({ features: [feature(), feature(), feature([NaN, 1]), feature([2, 48], 'FR'), feature([106, 80]), null] }),
    [{ label: 'Jalan Sudirman, Jakarta', latitude: -6.2, longitude: 106.8167 }]);
  assert.throws(() => parseAddressMatches({}));
  assert.deepEqual(parseAddressMatches({ features: [] }), []);
});

test('address search validates before fetch, coalesces/cache hits, and bounds public usage', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async input => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.hostname, 'photon.komoot.io');
    assert.equal(url.searchParams.get('countrycode'), 'ID');
    assert.equal(url.searchParams.get('limit'), '5');
    return Response.json({ features: [feature()] });
  };
  try {
    await assert.rejects(searchAddresses('a'));
    await assert.rejects(searchAddresses('a'.repeat(161)));
    assert.equal(calls, 0);
    const [a, b] = await Promise.all([searchAddresses('Jalan Sudirman Jakarta'), searchAddresses('jalan sudirman jakarta')]);
    assert.deepEqual(a, b);
    await searchAddresses('  JALAN  SUDIRMAN JAKARTA ');
    assert.equal(calls, 1);
    await assert.rejects(searchAddresses('Different address Jakarta'), /busy/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('search uses explicit submit, safe text rendering, cancellation and no private fields', async () => {
  const picker = await readFile('src/lib/delivery-pin.ts', 'utf8');
  const route = await readFile('src/pages/api/address-search.ts', 'utf8');
  assert.match(picker, /JSON\.stringify\(\{ q \}\)/);
  assert.match(picker, /button\.textContent = match\.label/);
  assert.match(picker, /request !== searchRequest \|\| panel\.hidden/);
  assert.match(picker, /searchInput\.addEventListener\('input', \(\) => \{ searchInput\.setCustomValidity\(''\); clearSearch\(\); \}\)/);
  assert.match(route, /allowShippingRequest\(`geocode:\$\{clientAddress\}`, 8\)/);
  assert.ok(!route.includes('biteship'));
});

test('address dropdown has keyboard controls, accessible state and compact search row', async () => {
  const picker = await readFile('src/lib/delivery-pin.ts', 'utf8');
  const fields = await readFile('src/components/organisms/DeliveryFields.astro', 'utf8');
  assert.match(fields, /role="combobox" aria-autocomplete="list" aria-expanded="false"/);
  assert.match(fields, /role="listbox"/);
  assert.match(fields, /grid-template-columns: minmax\(0, 1fr\) 44px/);
  assert.match(fields, /position: absolute; top: calc\(100% \+ 4px\)/);
  assert.match(picker, /event.key === 'ArrowDown' \|\| event.key === 'ArrowUp'/);
  assert.match(picker, /event.key === 'Escape'/);
  assert.match(picker, /aria-activedescendant/);
  assert.match(picker, /document.addEventListener\('pointerdown'/);
});

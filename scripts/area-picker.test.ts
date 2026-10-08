import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cityName, districtName, type DeliveryArea } from '../src/lib/area-picker';

const area: DeliveryArea = {
  id: 'example', name: 'Pesanggrahan, Jakarta Selatan, DKI Jakarta. 12250', postal_code: 12250,
  administrative_division_level_2_name: 'Jakarta Selatan',
  administrative_division_level_3_name: 'Pesanggrahan',
};
test('picker uses structured city and district, not province as city', () => {
  assert.equal(cityName(area), 'Jakarta Selatan');
  assert.equal(districtName(area), 'Pesanggrahan');
});
test('subdistrict is shown only when supplied by the provider', () => {
  assert.equal(districtName({ ...area, administrative_division_level_4_name: 'Bintaro' }), 'Pesanggrahan, Bintaro');
  assert.equal(cityName({ id: 'legacy', name: 'Legacy area', postal_code: 12345 }), '');
});

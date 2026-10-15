import assert from 'node:assert/strict';
import test from 'node:test';
import { requestCurrentLocation } from '../src/lib/current-location';

test('location is requested once with bounded wait and returns coordinates', async () => {
  let calls = 0;
  const coords = { latitude: -6.2475625, longitude: 106.8591875, accuracy: 15 } as GeolocationCoordinates;
  const provider = { getCurrentPosition(success: PositionCallback, _error?: PositionErrorCallback | null, options?: PositionOptions) {
    calls++;
    assert.deepEqual(options, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    success({ coords } as GeolocationPosition);
  } };
  assert.equal(calls, 0);
  assert.equal(await requestCurrentLocation(provider, true), coords);
  assert.equal(calls, 1);
});

test('unsupported or insecure contexts do not request location', async () => {
  const provider = { getCurrentPosition() { assert.fail('Location must not be requested'); } };
  await assert.rejects(requestCurrentLocation(provider, false), /unavailable/);
  await assert.rejects(requestCurrentLocation(undefined, true), /unavailable/);
});

test('denial, timeout and unavailable location preserve manual fallback', async () => {
  for (const [code, message] of [[1, /permission was denied/], [2, /could not be found/], [3, /timed out/]] as const) {
    const provider = { getCurrentPosition(_success: PositionCallback, error?: PositionErrorCallback | null) {
      error!({ code } as GeolocationPositionError);
    } };
    await assert.rejects(requestCurrentLocation(provider, true), message);
  }
});

test('invalid browser coordinates are rejected', async () => {
  const provider = { getCurrentPosition(success: PositionCallback) {
    success({ coords: { latitude: NaN, longitude: 200 } } as GeolocationPosition);
  } };
  await assert.rejects(requestCurrentLocation(provider, true), /could not be found/);
});

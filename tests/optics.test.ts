import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateImaging,
  calculateLaser,
  diffractionLimitedMtf,
  gaussianRadiusAtDistance,
  minimumOpticalDensity,
} from "../lib/optics.ts";

function closeTo(actual: number, expected: number, tolerance: number) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("thin-lens and sampling calculations match analytical references", () => {
  const result = calculateImaging({
    wavelengthNm: 550,
    focalLengthMm: 50,
    fNumber: 2.8,
    objectDistanceM: 1,
    sensorWidthMm: 36,
    sensorHeightMm: 24,
    pixelsX: 6000,
    pixelsY: 4000,
    circleOfConfusionUm: 20,
  });

  closeTo(result.imageDistanceMm, 52.6315789, 1e-6);
  closeTo(result.magnification, 0.05263158, 1e-8);
  closeTo(result.pixelPitchUm, 6, 1e-12);
  closeTo(result.airyDiameterUm, 3.7576, 1e-4);
  closeTo(result.nyquistLpPerMm, 83.3333333, 1e-6);
});

test("diffraction-limited circular-aperture MTF has correct endpoints", () => {
  assert.equal(diffractionLimitedMtf(0), 1);
  assert.equal(diffractionLimitedMtf(1), 0);
  closeTo(diffractionLimitedMtf(0.5), 0.3910022, 1e-6);
});

test("Gaussian beam radius reaches sqrt(2) times the waist at zR", () => {
  const result = calculateLaser({
    wavelengthNm: 1064,
    powerW: 1,
    waistRadiusMm: 0.5,
    mSquared: 1,
    evaluationDistanceM: 1,
    beamRadiusAtLensMm: 2,
    lensFocalLengthMm: 100,
  });
  closeTo(result.rayleighRangeM, 0.7381561686, 1e-10);
  const radius = gaussianRadiusAtDistance(
    0.0005,
    result.rayleighRangeM,
    result.rayleighRangeM,
  );
  closeTo(radius, 0.0005 * Math.sqrt(2), 1e-12);
  closeTo(result.divergenceHalfAngleMrad, 0.6773634, 1e-6);
});

test("optical density helper is a ratio in base ten", () => {
  assert.equal(minimumOpticalDensity(100, 0.01), 4);
  assert.equal(minimumOpticalDensity(0.001, 0.01), 0);
});

test("invalid physical inputs fail explicitly", () => {
  assert.throws(
    () =>
      calculateLaser({
        wavelengthNm: 532,
        powerW: 1,
        waistRadiusMm: 0.5,
        mSquared: 0.9,
        evaluationDistanceM: 1,
        beamRadiusAtLensMm: 1,
        lensFocalLengthMm: 50,
      }),
    /M²/,
  );
});

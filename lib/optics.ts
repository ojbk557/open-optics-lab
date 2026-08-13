export type ImagingInput = {
  wavelengthNm: number;
  focalLengthMm: number;
  fNumber: number;
  objectDistanceM: number;
  sensorWidthMm: number;
  sensorHeightMm: number;
  pixelsX: number;
  pixelsY: number;
  circleOfConfusionUm: number;
};

export type ImagingResult = {
  imageDistanceMm: number;
  magnification: number;
  fieldAngleDeg: number;
  fieldWidthMm: number;
  fieldHeightMm: number;
  pixelPitchUm: number;
  airyDiameterUm: number;
  nyquistLpPerMm: number;
  diffractionCutoffLpPerMm: number;
  diffractionMtfAtNyquist: number;
  hyperfocalM: number;
  nearLimitM: number;
  farLimitM: number;
};

export type LaserInput = {
  wavelengthNm: number;
  powerW: number;
  waistRadiusMm: number;
  mSquared: number;
  evaluationDistanceM: number;
  beamRadiusAtLensMm: number;
  lensFocalLengthMm: number;
};

export type LaserResult = {
  rayleighRangeM: number;
  divergenceHalfAngleMrad: number;
  radiusAtDistanceMm: number;
  diameterAtDistanceMm: number;
  peakIrradianceWPerCm2: number;
  focusedWaistUm: number;
  focusedRayleighRangeMm: number;
  focusedPeakIrradianceWPerCm2: number;
};

function assertPositive(label: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} 必须大于 0`);
  }
}
export function diffractionLimitedMtf(normalizedFrequency: number) {
  if (!Number.isFinite(normalizedFrequency) || normalizedFrequency <= 0) {
    return normalizedFrequency === 0 ? 1 : 0;
  }
  if (normalizedFrequency >= 1) return 0;
  const nu = normalizedFrequency;
  return (2 / Math.PI) * (Math.acos(nu) - nu * Math.sqrt(1 - nu * nu));
}

export function calculateImaging(input: ImagingInput): ImagingResult {
  Object.entries(input).forEach(([label, value]) => assertPositive(label, value));

  const wavelengthMm = input.wavelengthNm * 1e-6;
  const focalLengthMm = input.focalLengthMm;
  const objectDistanceMm = input.objectDistanceM * 1000;
  if (objectDistanceMm <= focalLengthMm) {
    throw new RangeError("物距必须大于焦距");
  }

  const imageDistanceMm =
    (focalLengthMm * objectDistanceMm) / (objectDistanceMm - focalLengthMm);
  const magnification = imageDistanceMm / objectDistanceMm;
  const fieldWidthMm = input.sensorWidthMm / magnification;
  const fieldHeightMm = input.sensorHeightMm / magnification;
  const fieldAngleDeg =
    (2 * Math.atan(input.sensorWidthMm / (2 * focalLengthMm)) * 180) /
    Math.PI;
  const pixelPitchMm = input.sensorWidthMm / input.pixelsX;
  const pixelPitchUm = pixelPitchMm * 1000;
  const airyDiameterUm =
    2.44 * input.wavelengthNm * 1e-3 * input.fNumber;
  const nyquistLpPerMm = 1 / (2 * pixelPitchMm);
  const diffractionCutoffLpPerMm =
    1 / (wavelengthMm * input.fNumber);
  const diffractionMtfAtNyquist = diffractionLimitedMtf(
    nyquistLpPerMm / diffractionCutoffLpPerMm,
  );

  const circleOfConfusionMm = input.circleOfConfusionUm / 1000;
  const hyperfocalMm =
    (focalLengthMm * focalLengthMm) /
      (input.fNumber * circleOfConfusionMm) +
    focalLengthMm;
  const nearLimitMm =
    (hyperfocalMm * objectDistanceMm) /
    (hyperfocalMm + objectDistanceMm - focalLengthMm);
  const farDenominator = hyperfocalMm - (objectDistanceMm - focalLengthMm);
  const farLimitMm =
    farDenominator <= 0
      ? Number.POSITIVE_INFINITY
      : (hyperfocalMm * objectDistanceMm) / farDenominator;

  return {
    imageDistanceMm,
    magnification,
    fieldAngleDeg,
    fieldWidthMm,
    fieldHeightMm,
    pixelPitchUm,
    airyDiameterUm,
    nyquistLpPerMm,
    diffractionCutoffLpPerMm,
    diffractionMtfAtNyquist,
    hyperfocalM: hyperfocalMm / 1000,
    nearLimitM: nearLimitMm / 1000,
    farLimitM: farLimitMm / 1000,
  };
}

export function gaussianRadiusAtDistance(
  waistRadiusM: number,
  distanceM: number,
  rayleighRangeM: number,
) {
  return waistRadiusM *
    Math.sqrt(1 + (distanceM / rayleighRangeM) ** 2);
}

export function calculateLaser(input: LaserInput): LaserResult {
  Object.entries(input).forEach(([label, value]) => assertPositive(label, value));
  if (input.mSquared < 1) {
    throw new RangeError("M² 不能小于 1");
  }

  const wavelengthM = input.wavelengthNm * 1e-9;
  const waistRadiusM = input.waistRadiusMm * 1e-3;
  const rayleighRangeM =
    (Math.PI * waistRadiusM * waistRadiusM) /
    (input.mSquared * wavelengthM);
  const divergenceHalfAngleRad =
    (input.mSquared * wavelengthM) / (Math.PI * waistRadiusM);
  const radiusAtDistanceM = gaussianRadiusAtDistance(
    waistRadiusM,
    input.evaluationDistanceM,
    rayleighRangeM,
  );
  const peakIrradianceWPerM2 =
    (2 * input.powerW) / (Math.PI * radiusAtDistanceM ** 2);

  const beamRadiusAtLensM = input.beamRadiusAtLensMm * 1e-3;
  const lensFocalLengthM = input.lensFocalLengthMm * 1e-3;
  const focusedWaistM =
    (input.mSquared * wavelengthM * lensFocalLengthM) /
    (Math.PI * beamRadiusAtLensM);
  const focusedRayleighRangeM =
    (Math.PI * focusedWaistM * focusedWaistM) /
    (input.mSquared * wavelengthM);
  const focusedPeakIrradianceWPerM2 =
    (2 * input.powerW) / (Math.PI * focusedWaistM ** 2);

  return {
    rayleighRangeM,
    divergenceHalfAngleMrad: divergenceHalfAngleRad * 1000,
    radiusAtDistanceMm: radiusAtDistanceM * 1000,
    diameterAtDistanceMm: radiusAtDistanceM * 2000,
    peakIrradianceWPerCm2: peakIrradianceWPerM2 / 10000,
    focusedWaistUm: focusedWaistM * 1e6,
    focusedRayleighRangeMm: focusedRayleighRangeM * 1000,
    focusedPeakIrradianceWPerCm2:
      focusedPeakIrradianceWPerM2 / 10000,
  };
}

export function minimumOpticalDensity(
  exposure: number,
  maximumPermissibleExposure: number,
) {
  assertPositive("exposure", exposure);
  assertPositive("maximumPermissibleExposure", maximumPermissibleExposure);
  return Math.max(0, Math.log10(exposure / maximumPermissibleExposure));
}

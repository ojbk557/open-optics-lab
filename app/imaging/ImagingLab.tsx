"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { NumberField } from "../components/NumberField";
import {
  calculateImaging,
  diffractionLimitedMtf,
  type ImagingInput,
  type ImagingResult,
} from "../../lib/optics";

const fullFramePreset: ImagingInput = {
  wavelengthNm: 550,
  focalLengthMm: 50,
  fNumber: 4,
  objectDistanceM: 2,
  sensorWidthMm: 36,
  sensorHeightMm: 24,
  pixelsX: 6000,
  pixelsY: 4000,
  circleOfConfusionUm: 20,
};

const machineVisionPreset: ImagingInput = {
  wavelengthNm: 530,
  focalLengthMm: 16,
  fNumber: 5.6,
  objectDistanceM: 0.5,
  sensorWidthMm: 7.2,
  sensorHeightMm: 5.4,
  pixelsX: 1920,
  pixelsY: 1440,
  circleOfConfusionUm: 7.5,
};

function format(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "∞";
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: digits,
  }).format(value);
}
function useImagingResult(input: ImagingInput) {
  return useMemo(() => {
    try {
      return { result: calculateImaging(input), error: "" };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "参数无法计算",
      };
    }
  }, [input]);
}

function useRayDiagram(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  input: ImagingInput,
  result: ImagingResult | null,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = 250;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const axisY = height * 0.56;
      const objectX = width * 0.1;
      const lensX = width * 0.51;
      const sensorX = width * 0.84;
      const objectHeight = Math.min(84, 28 + result.fieldAngleDeg * 0.8);
      const imageHeight = Math.max(14, Math.min(54, objectHeight * result.magnification * 8));

      context.strokeStyle = "rgba(214, 224, 235, 0.24)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(24, axisY);
      context.lineTo(width - 24, axisY);
      context.stroke();

      context.strokeStyle = "#55d6d0";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(lensX, 40);
      context.quadraticCurveTo(lensX - 14, axisY, lensX, height - 34);
      context.moveTo(lensX, 40);
      context.quadraticCurveTo(lensX + 14, axisY, lensX, height - 34);
      context.stroke();

      context.strokeStyle = "#f7f2e7";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(objectX, axisY);
      context.lineTo(objectX, axisY - objectHeight);
      context.stroke();

      context.strokeStyle = "#fb6d38";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(objectX, axisY - objectHeight);
      context.lineTo(lensX, axisY - objectHeight * 0.45);
      context.lineTo(sensorX, axisY + imageHeight);
      context.moveTo(objectX, axisY - objectHeight);
      context.lineTo(lensX, axisY);
      context.lineTo(sensorX, axisY + imageHeight);
      context.stroke();

      context.strokeStyle = "#b5bcc6";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(sensorX, 40);
      context.lineTo(sensorX, height - 34);
      context.stroke();

      context.fillStyle = "#8e99a8";
      context.font = "11px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillText(`${input.objectDistanceM} m`, objectX - 16, height - 14);
      context.fillText(`${input.focalLengthMm} mm`, lensX - 24, height - 14);
      context.fillText("SENSOR", sensorX - 22, height - 14);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, input, result]);
}

function useMtfDiagram(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  result: ImagingResult | null,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = 220;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const left = 42;
      const right = width - 18;
      const top = 18;
      const bottom = height - 32;
      context.strokeStyle = "rgba(214, 224, 235, 0.24)";
      context.lineWidth = 1;
      for (let index = 0; index <= 4; index += 1) {
        const y = top + ((bottom - top) * index) / 4;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(right, y);
        context.stroke();
      }

      context.strokeStyle = "#55d6d0";
      context.lineWidth = 3;
      context.beginPath();
      for (let index = 0; index <= 100; index += 1) {
        const nu = index / 100;
        const x = left + nu * (right - left);
        const y = bottom - diffractionLimitedMtf(nu) * (bottom - top);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();

      const nyquistRatio = Math.min(
        1,
        result.nyquistLpPerMm / result.diffractionCutoffLpPerMm,
      );
      const markerX = left + nyquistRatio * (right - left);
      context.strokeStyle = "#fb6d38";
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(markerX, top);
      context.lineTo(markerX, bottom);
      context.stroke();
      context.setLineDash([]);

      context.fillStyle = "#8e99a8";
      context.font = "11px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillText("MTF 1.0", 0, top + 4);
      context.fillText("0", 28, bottom + 4);
      context.fillText("0", left - 3, height - 10);
      context.fillText(
        `${format(result.diffractionCutoffLpPerMm, 0)} lp/mm`,
        Math.max(left, right - 68),
        height - 10,
      );
      context.fillStyle = "#fb6d38";
      context.fillText("NYQUIST", Math.min(markerX + 5, right - 52), top + 12);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, result]);
}

export function ImagingLab() {
  const [input, setInput] = useState<ImagingInput>(fullFramePreset);
  const { result, error } = useImagingResult(input);
  const rayCanvas = useRef<HTMLCanvasElement>(null);
  const mtfCanvas = useRef<HTMLCanvasElement>(null);
  useRayDiagram(rayCanvas, input, result);
  useMtfDiagram(mtfCanvas, result);

  const update = (key: keyof ImagingInput) => (value: number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="lab-workspace" aria-label="成像光学计算工作台">
      <aside className="control-panel">
        <div className="panel-heading">
          <div><span>INPUT</span><h2>系统参数</h2></div>
          <span className="live-indicator"><i /> LIVE</span>
        </div>
        <div className="preset-row" aria-label="成像预设">
          <button type="button" onClick={() => setInput(fullFramePreset)}>全画幅</button>
          <button type="button" onClick={() => setInput(machineVisionPreset)}>机器视觉</button>
        </div>
        <div className="field-group">
          <h3>光谱与镜头</h3>
          <NumberField label="工作波长" unit="nm" value={input.wavelengthNm} min={200} max={2000} step={1} onChange={update("wavelengthNm")} />
          <NumberField label="焦距" unit="mm" value={input.focalLengthMm} min={1} step={1} onChange={update("focalLengthMm")} />
          <NumberField label="光圈数" unit="f/#" value={input.fNumber} min={0.5} step={0.1} onChange={update("fNumber")} />
          <NumberField label="物距" unit="m" value={input.objectDistanceM} min={0.01} step={0.1} onChange={update("objectDistanceM")} />
        </div>
        <div className="field-group">
          <h3>传感器与判据</h3>
          <div className="field-pair">
            <NumberField label="宽度" unit="mm" value={input.sensorWidthMm} min={0.1} step={0.1} onChange={update("sensorWidthMm")} />
            <NumberField label="高度" unit="mm" value={input.sensorHeightMm} min={0.1} step={0.1} onChange={update("sensorHeightMm")} />
          </div>
          <div className="field-pair">
            <NumberField label="横向像素" unit="px" value={input.pixelsX} min={1} step={1} onChange={update("pixelsX")} />
            <NumberField label="纵向像素" unit="px" value={input.pixelsY} min={1} step={1} onChange={update("pixelsY")} />
          </div>
          <NumberField label="容许弥散圆" unit="μm" value={input.circleOfConfusionUm} min={0.1} step={0.5} hint="用于景深近似，不等同于像元尺寸" onChange={update("circleOfConfusionUm")} />
        </div>
        <p className="model-note">模型：薄透镜、圆孔衍射、非相干衍射极限 MTF。未计入像差、畸变和装调误差。</p>
      </aside>

      <div className="result-panel" aria-live="polite">
        {error || !result ? (
          <div className="calculation-error"><strong>暂时无法计算</strong><span>{error}</span></div>
        ) : (
          <>
            <div className="metrics-grid">
              <MetricCard tone="cyan" label="水平视场" value={`${format(result.fieldWidthMm / 1000)} m`} note={`${format(result.fieldAngleDeg)}° 视场角`} />
              <MetricCard label="像元尺寸" value={`${format(result.pixelPitchUm)} μm`} note={`${format(result.nyquistLpPerMm)} lp/mm Nyquist`} />
              <MetricCard tone="orange" label="艾里斑直径" value={`${format(result.airyDiameterUm)} μm`} note={`λ ${input.wavelengthNm} nm · f/${input.fNumber}`} />
              <MetricCard label="Nyquist 处 MTF" value={format(result.diffractionMtfAtNyquist, 3)} note="仅衍射极限圆孔模型" />
              <MetricCard label="像距" value={`${format(result.imageDistanceMm)} mm`} note={`放大率 ${format(result.magnification, 4)}×`} />
              <MetricCard label="景深范围" value={`${format(result.nearLimitM)}–${format(result.farLimitM)} m`} note={`超焦距 ${format(result.hyperfocalM)} m`} />
            </div>

            <div className="visual-grid">
              <article className="plot-card plot-wide">
                <div className="plot-heading"><div><span>GEOMETRY</span><h3>一阶成像示意</h3></div><small>{format(result.fieldWidthMm / 1000)} × {format(result.fieldHeightMm / 1000)} m 物方范围</small></div>
                <canvas ref={rayCanvas} aria-label="物体、薄透镜与传感器之间的光线示意图" />
              </article>
              <article className="plot-card">
                <div className="plot-heading"><div><span>DIFFRACTION</span><h3>圆孔衍射 MTF</h3></div><small>橙线 = 传感器 Nyquist</small></div>
                <canvas ref={mtfCanvas} aria-label="衍射极限 MTF 曲线和传感器 Nyquist 频率" />
              </article>
              <article className="insight-card">
                <span className="insight-index">SYSTEM READ</span>
                <h3>{result.airyDiameterUm > result.pixelPitchUm * 2 ? "当前更接近衍射受限" : "当前采样仍有余量"}</h3>
                <p>{result.airyDiameterUm > result.pixelPitchUm * 2 ? "艾里斑已超过两个像元宽度。继续缩小光圈会更明显地损失高频细节。" : "艾里斑尚未覆盖两个像元。实际分辨率还会受到像差、对焦和运动的影响。"}</p>
                <dl>
                  <div><dt>衍射截止</dt><dd>{format(result.diffractionCutoffLpPerMm)} lp/mm</dd></div>
                  <div><dt>传感器 Nyquist</dt><dd>{format(result.nyquistLpPerMm)} lp/mm</dd></div>
                </dl>
              </article>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

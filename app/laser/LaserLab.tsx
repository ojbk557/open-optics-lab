"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { NumberField } from "../components/NumberField";
import {
  calculateLaser,
  gaussianRadiusAtDistance,
  type LaserInput,
  type LaserResult,
} from "../../lib/optics";

const nearInfraredPreset: LaserInput = {
  wavelengthNm: 1064,
  powerW: 1,
  waistRadiusMm: 0.5,
  mSquared: 1.1,
  evaluationDistanceM: 1,
  beamRadiusAtLensMm: 2,
  lensFocalLengthMm: 100,
};

const greenPreset: LaserInput = {
  wavelengthNm: 532,
  powerW: 0.005,
  waistRadiusMm: 0.75,
  mSquared: 1.2,
  evaluationDistanceM: 2,
  beamRadiusAtLensMm: 1.5,
  lensFocalLengthMm: 75,
};

function format(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "∞";
  if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
    return value.toExponential(2);
  }
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: digits,
  }).format(value);
}
function useLaserResult(input: LaserInput) {
  return useMemo(() => {
    try {
      return { result: calculateLaser(input), error: "" };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "参数无法计算",
      };
    }
  }, [input]);
}

function useBeamDiagram(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  input: LaserInput,
  result: LaserResult | null,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = 310;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const left = 34;
      const right = width - 24;
      const centerY = height * 0.51;
      const plotHeight = height * 0.34;
      const span = Math.max(
        input.evaluationDistanceM * 1.25,
        result.rayleighRangeM * 2.6,
        0.5,
      );
      const waistRadiusM = input.waistRadiusMm * 1e-3;
      const maxRadius = gaussianRadiusAtDistance(
        waistRadiusM,
        span,
        result.rayleighRangeM,
      );
      const samples: Array<{ x: number; y: number }> = [];

      for (let index = 0; index <= 180; index += 1) {
        const z = -span + (2 * span * index) / 180;
        const radius = gaussianRadiusAtDistance(
          waistRadiusM,
          z,
          result.rayleighRangeM,
        );
        samples.push({
          x: left + ((z + span) / (2 * span)) * (right - left),
          y: (radius / maxRadius) * plotHeight,
        });
      }

      const gradient = context.createLinearGradient(left, 0, right, 0);
      gradient.addColorStop(0, "rgba(251, 109, 56, 0.02)");
      gradient.addColorStop(0.5, "rgba(251, 109, 56, 0.32)");
      gradient.addColorStop(1, "rgba(251, 109, 56, 0.04)");
      context.fillStyle = gradient;
      context.beginPath();
      samples.forEach((point, index) => {
        const y = centerY - point.y;
        if (index === 0) context.moveTo(point.x, y);
        else context.lineTo(point.x, y);
      });
      [...samples].reverse().forEach((point) => {
        context.lineTo(point.x, centerY + point.y);
      });
      context.closePath();
      context.fill();

      context.strokeStyle = "#fb6d38";
      context.lineWidth = 2.5;
      for (const direction of [-1, 1]) {
        context.beginPath();
        samples.forEach((point, index) => {
          const y = centerY + direction * point.y;
          if (index === 0) context.moveTo(point.x, y);
          else context.lineTo(point.x, y);
        });
        context.stroke();
      }

      context.strokeStyle = "rgba(214, 224, 235, 0.28)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(left, centerY);
      context.lineTo(right, centerY);
      context.stroke();

      const waistX = (left + right) / 2;
      context.strokeStyle = "#55d6d0";
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(waistX, centerY - plotHeight - 18);
      context.lineTo(waistX, centerY + plotHeight + 18);
      context.stroke();

      const evaluationRatio = Math.min(1, input.evaluationDistanceM / span);
      const evaluationX = waistX + evaluationRatio * (right - left) * 0.5;
      context.strokeStyle = "#f7f2e7";
      context.beginPath();
      context.moveTo(evaluationX, 42);
      context.lineTo(evaluationX, height - 38);
      context.stroke();
      context.setLineDash([]);

      context.fillStyle = "#8e99a8";
      context.font = "11px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillText(`−${format(span)} m`, left, height - 14);
      context.fillText("WAIST", waistX - 18, height - 14);
      context.fillText(`+${format(span)} m`, right - 42, height - 14);
      context.fillStyle = "#f7f2e7";
      context.fillText(
        `z = ${format(input.evaluationDistanceM)} m`,
        Math.min(evaluationX + 6, right - 72),
        30,
      );
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, input, result]);
}

export function LaserLab() {
  const [input, setInput] = useState<LaserInput>(nearInfraredPreset);
  const { result, error } = useLaserResult(input);
  const beamCanvas = useRef<HTMLCanvasElement>(null);
  useBeamDiagram(beamCanvas, input, result);

  const update = (key: keyof LaserInput) => (value: number) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <section className="lab-workspace" aria-label="激光光束计算工作台">
        <aside className="control-panel">
          <div className="panel-heading">
            <div><span>INPUT</span><h2>光束参数</h2></div>
            <span className="live-indicator live-orange"><i /> LIVE</span>
          </div>
          <div className="preset-row" aria-label="激光模拟预设">
            <button type="button" onClick={() => setInput(nearInfraredPreset)}>1064 nm 模拟</button>
            <button type="button" onClick={() => setInput(greenPreset)}>532 nm 模拟</button>
          </div>
          <div className="field-group">
            <h3>光源与初始束腰</h3>
            <NumberField label="工作波长" unit="nm" value={input.wavelengthNm} min={200} max={11000} step={1} onChange={update("wavelengthNm")} />
            <NumberField label="连续波功率" unit="W" value={input.powerW} min={0.000001} step={0.001} onChange={update("powerW")} />
            <NumberField label="束腰半径 w₀" unit="mm" value={input.waistRadiusMm} min={0.001} step={0.01} onChange={update("waistRadiusMm")} />
            <NumberField label="光束质量 M²" unit="—" value={input.mSquared} min={1} step={0.05} onChange={update("mSquared")} />
            <NumberField label="观察距离 z" unit="m" value={input.evaluationDistanceM} min={0.0001} step={0.1} onChange={update("evaluationDistanceM")} />
          </div>
          <div className="field-group">
            <h3>薄透镜聚焦估算</h3>
            <NumberField label="透镜处光束半径" unit="mm" value={input.beamRadiusAtLensMm} min={0.001} step={0.1} onChange={update("beamRadiusAtLensMm")} />
            <NumberField label="透镜焦距" unit="mm" value={input.lensFocalLengthMm} min={0.1} step={1} onChange={update("lensFocalLengthMm")} />
          </div>
          <p className="model-note model-note-orange">模型：近轴高斯光束、连续波峰值辐照度和充分填充薄透镜的近似聚焦。未计入截光、像差、热透镜和脉冲峰值。</p>
        </aside>

        <div className="result-panel" aria-live="polite">
          {error || !result ? (
            <div className="calculation-error"><strong>暂时无法计算</strong><span>{error}</span></div>
          ) : (
            <>
              <div className="metrics-grid">
                <MetricCard tone="orange" label="瑞利长度" value={`${format(result.rayleighRangeM)} m`} note="束腰半径增至 √2 倍的位置" />
                <MetricCard label="远场半发散角" value={`${format(result.divergenceHalfAngleMrad, 3)} mrad`} note={`M² = ${input.mSquared}`} />
                <MetricCard tone="cyan" label={`z = ${format(input.evaluationDistanceM)} m 光斑`} value={`${format(result.diameterAtDistanceMm)} mm`} note="1/e² 强度直径" />
                <MetricCard label="该处峰值辐照度" value={`${format(result.peakIrradianceWPerCm2)} W/cm²`} note="连续波高斯分布中心" />
                <MetricCard tone="orange" label="估算聚焦束腰" value={`${format(result.focusedWaistUm)} μm`} note={`f = ${input.lensFocalLengthMm} mm`} />
                <MetricCard label="焦点峰值辐照度" value={`${format(result.focusedPeakIrradianceWPerCm2)} W/cm²`} note="理想近轴模型，不作安全依据" />
              </div>

              <div className="visual-grid laser-visual-grid">
                <article className="plot-card plot-wide beam-plot">
                  <div className="plot-heading"><div><span>PROPAGATION</span><h3>高斯光束包络</h3></div><small>w₀ = {input.waistRadiusMm} mm · zᵣ = {format(result.rayleighRangeM)} m</small></div>
                  <canvas ref={beamCanvas} aria-label="高斯光束从束腰向前后传播的半径变化曲线" />
                </article>
                <article className="insight-card laser-insight">
                  <span className="insight-index">FOCUS READ</span>
                  <h3>聚焦结果是理想下限</h3>
                  <p>公式假设光束充分填充薄透镜且像差可忽略。真实焦斑通常会因截光、镜头像差、M² 测量误差和热效应变大。</p>
                  <dl>
                    <div><dt>焦区瑞利长度</dt><dd>{format(result.focusedRayleighRangeMm)} mm</dd></div>
                    <div><dt>透镜填充半径</dt><dd>{format(input.beamRadiusAtLensMm)} mm</dd></div>
                  </dl>
                </article>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="safety-section" aria-labelledby="safety-title">
        <div className="safety-heading">
          <p className="section-kicker">SAFETY / IEC 60825-1</p>
          <h2 id="safety-title">安全等级不是一个光束传播结果。</h2>
          <p>当前输入不足以确定 IEC 60825-1 的 Class 1、2、3R、3B 或 4，也不足以选择护目镜 OD（光密度）。</p>
        </div>
        <div className="safety-grid">
          <article>
            <span>01 / CLASS</span>
            <h3>必须补齐可接近发射条件</h3>
            <p>等级评估还需要曝光时间、孔径、脉冲宽度与重复频率、扫描方式、外壳和联锁状态。不能只凭波长与标称功率分类。</p>
          </article>
          <article>
            <span>02 / EYEWEAR</span>
            <h3>OD 必须基于 MPE</h3>
            <p>最低 OD 可按 OD ≥ log₁₀(H/MPE) 初筛，但 MPE 与认证等级必须由合格的激光安全负责人确定。选用对应波段的 Laservision、Honeywell/Uvex 或 Thorlabs 合规产品。</p>
          </article>
          <article>
            <span>03 / BEAM PATH</span>
            <h3>Class 3B / 4 采用工程控制</h3>
            <p>封闭光路并配置联锁、钥匙开关、束路终止器与光束挡板；移除手表、戒指和金属工具，禁止裸眼观察直射光或反射光。</p>
          </article>
          <article>
            <span>04 / LAB</span>
            <h3>器材和区域持续受控</h3>
            <p>光学件标注镀膜与清洁日期，干燥存放；工作区设置警示和人员限制，实验结束关闭光源并安装安全盖。</p>
          </article>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "vinext/shims/metadata";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { LaserLab } from "./LaserLab";

export const metadata: Metadata = {
  title: "激光光束实验室",
  description: "计算高斯光束传播、瑞利长度、发散角、聚焦束腰与峰值功率密度。",
};

export default function LaserPage() {
  return (
    <div className="page-shell lab-page laser-page">
      <SiteHeader active="laser" />
      <main>
        <section className="lab-hero">
          <div>
            <p className="eyebrow"><span aria-hidden="true" /> LAB 02 / LASER BEAM</p>
            <h1>激光光束实验室</h1>
            <p>从束腰出发观察光束如何传播与聚焦；计算结果和安全结论严格分开。</p>
          </div>
          <div className="formula-ticket formula-orange" aria-label="核心公式">
            <span>GAUSSIAN BEAM</span>
            <strong>w(z) = w₀ √(1 + z²/zᵣ²)</strong>
            <small>连续波 · 近轴高斯光束近似</small>
          </div>
        </section>
        <LaserLab />
      </main>
      <SiteFooter />
    </div>
  );
}

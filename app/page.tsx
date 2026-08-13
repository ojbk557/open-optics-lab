import type { Metadata } from "vinext/shims/metadata";
import Link from "vinext/shims/link";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

export const metadata: Metadata = {
  title: "OpenOptics Lab",
  description: "把成像与激光光路的关键参数先算清楚。",
};

export default function Home() {
  return (
    <div className="page-shell home-page">
      <SiteHeader active="home" />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true" /> OPEN OPTICS / BROWSER LAB
            </p>
            <h1>把光路先算清楚。</h1>
            <p className="hero-lede">
              两个透明、可验证的光学工作台。参数写在左边，假设摆在明面，结果实时出现。
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/imaging">
                进入成像实验室 <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button button-ghost" href="/laser">
                进入激光实验室
              </Link>
            </div>
          </div>
          <div className="hero-instrument" aria-hidden="true">
            <div className="instrument-grid" />
            <div className="aperture-ring ring-one" />
            <div className="aperture-ring ring-two" />
            <div className="aperture-core" />
            <div className="beam-line" />
            <div className="instrument-readout">
              <span>λ 550 nm</span>
              <strong>MTF / BEAM</strong>
              <span>LIVE MODEL</span>
            </div>
          </div>
        </section>

        <section className="lab-index" aria-labelledby="lab-index-title">
          <div className="section-heading">
            <p className="section-kicker">01 — 两个实验室</p>
            <h2 id="lab-index-title">从公式，到可以讨论的结果。</h2>
          </div>
          <div className="lab-card-grid">
            <Link className="lab-card imaging-card" href="/imaging">
              <span className="lab-number">01</span>
              <div>
                <p>IMAGING OPTICS</p>
                <h3>成像光学</h3>
                <p className="lab-description">
                  镜头、传感器、物距与波长放进同一个模型，快速检查视场、采样和衍射预算。
                </p>
              </div>
              <ul>
                <li>薄透镜与视场</li>
                <li>像元采样与艾里斑</li>
                <li>衍射极限 MTF</li>
              </ul>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link className="lab-card laser-card" href="/laser">
              <span className="lab-number">02</span>
              <div>
                <p>LASER BEAM</p>
                <h3>激光光束</h3>
                <p className="lab-description">
                  用高斯光束模型观察束腰、传播、聚焦与功率密度，同时保留明确的安全边界。
                </p>
              </div>
              <ul>
                <li>瑞利长度与发散角</li>
                <li>任意位置光斑</li>
                <li>透镜聚焦估算</li>
              </ul>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        <section className="principles-strip" aria-label="产品原则">
          <div><strong>01</strong><span>解析模型</span><small>每个结果都有公式来源</small></div>
          <div><strong>02</strong><span>单位透明</span><small>毫米、微米与米不再混淆</small></div>
          <div><strong>03</strong><span>本地计算</span><small>参数不离开你的浏览器</small></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

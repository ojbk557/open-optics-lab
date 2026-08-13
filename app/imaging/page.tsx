import type { Metadata } from "vinext/shims/metadata";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { ImagingLab } from "./ImagingLab";

export const metadata: Metadata = {
  title: "成像光学实验室",
  description: "计算薄透镜成像、视场、景深、艾里斑、采样率与衍射极限 MTF。",
};

export default function ImagingPage() {
  return (
    <div className="page-shell lab-page imaging-page">
      <SiteHeader active="imaging" />
      <main>
        <section className="lab-hero">
          <div>
            <p className="eyebrow"><span aria-hidden="true" /> LAB 01 / IMAGING OPTICS</p>
            <h1>成像光学实验室</h1>
            <p>把焦距、传感器与波长放在一张工作台上，先看清系统真正由什么限制。</p>
          </div>
          <div className="formula-ticket" aria-label="核心公式">
            <span>THIN LENS</span>
            <strong>1/f = 1/u + 1/v</strong>
            <small>几何成像 + 衍射极限近似</small>
          </div>
        </section>
        <ImagingLab />
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "vinext/shims/link";

type SiteHeaderProps = {
  active?: "home" | "imaging" | "laser";
};

export function SiteHeader({ active = "home" }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="OpenOptics Lab 首页">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
        </span>
        <span>
          <strong>OpenOptics</strong>
          <small>LAB / 01</small>
        </span>
      </Link>
      <nav className="site-nav" aria-label="主要导航">
        <Link
          href="/imaging"
          aria-current={active === "imaging" ? "page" : undefined}
        >
          成像
        </Link>
        <Link
          href="/laser"
          aria-current={active === "laser" ? "page" : undefined}
        >
          激光
        </Link>
      </nav>
    </header>
  );
}

import { NavLink, Outlet, Link } from "react-router-dom";
import { HeartHandshake, Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";

const links = [
  ["About", "/about"],
  ["Projects", "/projects"],
  ["Events", "/events"],
  ["Get involved", "/get-involved"],
];

export default function SiteLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[#e8e7df] bg-[#f8f7f2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#183d32] text-white"><HeartHandshake size={21} /></span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-[#183d32]">COMMUNITY SERVICE</span>
              <span className="block text-xs tracking-[0.18em] text-[#6d766f]">SOCIETY</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {links.map(([label, to]) => <NavLink key={to} to={to} className={({ isActive }) => `text-sm transition ${isActive ? "font-semibold text-[#183d32]" : "text-[#59615c] hover:text-[#183d32]"}`}>{label}</NavLink>)}
            <Link to="/get-involved" className="rounded-full bg-[#183d32] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285b49]">Join the effort <ArrowUpRight className="ml-1 inline" size={15} /></Link>
          </nav>
          <button className="rounded-lg p-2 text-[#183d32] md:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && <nav className="flex flex-col gap-4 border-t border-[#e8e7df] px-5 py-5 md:hidden">{links.map(([label, to]) => <NavLink onClick={() => setOpen(false)} key={to} to={to} className="text-sm font-medium text-[#183d32]">{label}</NavLink>)}</nav>}
      </header>
      <main><Outlet /></main>
      <footer className="bg-[#183d32] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-3"><HeartHandshake size={25} /><span className="font-semibold tracking-wide">COMMUNITY SERVICE SOCIETY</span></div>
            <p className="max-w-md text-sm leading-7 text-white/70">A university society committed to meaningful service, community engagement and positive change.</p>
          </div>
          <div className="md:justify-self-end">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Explore</p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-white/80">
              {links.map(([label, to]) => <Link key={to} to={to} className="hover:text-white">{label}</Link>)}
              <Link to="/admin" className="hover:text-white">Admin login</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/15 px-5 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} Community Service Society · University affiliation to be added</div>
      </footer>
    </div>
  );
}
import { Link } from "react-router-dom";
export default function NotFound() {
  return <div className="mx-auto max-w-3xl px-5 py-32 text-center"><p className="text-xs font-bold uppercase tracking-widest text-[#829084]">404 · Page not found</p><h1 className="display-font mt-4 text-5xl text-[#183d32]">This page isn't here.</h1><Link to="/" className="mt-8 inline-block rounded-full bg-[#183d32] px-6 py-3 text-sm font-semibold text-white">Return home</Link></div>;
}
import SectionHeading from "../components/SectionHeading.jsx";
import { projects } from "../data/content.js";

export default function Projects() {
  return <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
    <SectionHeading eyebrow="Our work" title="Initiatives & projects" description="Explore the activities through which the society works alongside communities. These entries are illustrative placeholders." />
    <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => <article key={p.title} className="overflow-hidden border border-[#e4e3dc] bg-white">
        <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover"/>
        <div className="p-6"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wider text-[#668574]">{p.category}</span><span className="rounded-full bg-[#edf1eb] px-3 py-1 text-xs text-[#45634f]">{p.status}</span></div><h2 className="display-font mt-4 text-2xl text-[#183d32]">{p.title}</h2><p className="mt-3 text-sm leading-7 text-[#68716b]">{p.description}</p><p className="mt-5 text-xs text-[#899189]">{p.date}</p></div>
      </article>)}
    </div>
  </div>;
}
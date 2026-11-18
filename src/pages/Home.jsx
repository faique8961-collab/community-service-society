import { Link } from "react-router-dom";
import { ArrowUpRight, Heart, Users, Sprout, BookOpen, MoveRight } from "lucide-react";
import SectionHeading from "../components/SectionHeading.jsx";
import { projects } from "../data/content.js";

const focusAreas = [
  { icon: Heart, title: "Community welfare", text: "Supporting people and communities through thoughtful, practical initiatives." },
  { icon: BookOpen, title: "Education", text: "Creating opportunities to learn, grow and share knowledge." },
  { icon: Sprout, title: "Environment", text: "Encouraging care for shared spaces and a more sustainable future." },
];

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#183d32]">
        <div className="absolute inset-0 -z-10 opacity-25" style={{ backgroundImage: "linear-gradient(90deg, #183d32 0%, transparent 100%), url('https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=2000&q=85')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-10 px-5 py-24 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.25em] text-[#e0bd7e]">University · Community · Service</p>
            <h1 className="display-font text-6xl leading-[1.04] tracking-tight text-white sm:text-7xl lg:text-8xl">Small acts.<br/><span className="text-[#e0bd7e]">Meaningful</span><br/>change.</h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-white/75 sm:text-lg">Bringing students together to serve communities, support people and turn compassion into meaningful action.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/projects" className="rounded-full bg-[#e0bd7e] px-6 py-3.5 text-sm font-bold text-[#183d32] hover:bg-[#edcf9b]">Explore our work <ArrowUpRight className="ml-2 inline" size={16}/></Link>
              <Link to="/about" className="rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10">Discover the society</Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="ml-auto max-w-sm border-l border-white/40 py-4 pl-7">
              <p className="display-font text-3xl leading-snug text-white">“The best way to find yourself is to lose yourself in the service of others.”</p>
              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/55">A starting point for our story</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#d5a65a]"/>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <SectionHeading eyebrow="Who we are" title="Service begins with showing up." />
        <div>
          <p className="text-xl leading-9 text-[#46524a]">We are a student-led community service society working to connect the energy, skills and compassion of university students with the needs of the wider community.</p>
          <p className="mt-5 leading-8 text-[#778078]">Through outreach, volunteering and collaborative initiatives, we aim to make service a meaningful part of student life. This introduction will be replaced with the society's approved mission and history.</p>
          <Link to="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#183d32]">More about us <MoveRight size={17}/></Link>
        </div>
      </section>

      <section className="bg-[#efeee7] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Our focus" title="Many ways to make a difference." description="The society's actual areas of work will be confirmed during content discovery." />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {focusAreas.map(({ icon: Icon, title, text }, i) => <article key={title} className="border-t border-[#c9cec5] pt-7">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#183d32] text-[#e0bd7e]"><Icon size={21}/></div>
              <p className="mb-3 text-xs font-bold text-[#829084]">0{i+1}</p>
              <h3 className="display-font text-2xl text-[#183d32]">{title}</h3>
              <p className="mt-3 leading-7 text-[#69736b]">{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Selected initiatives" title="Where action takes shape." description="A preview of how the society's projects will appear." />
          <Link to="/projects" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-[#183d32]">All projects <ArrowUpRight size={17}/></Link>
        </div>
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {projects.map((project) => <article key={project.title} className="group">
            <div className="aspect-[4/3] overflow-hidden rounded-sm bg-[#e2e4dc]"><img src={project.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#829084]">{project.category}</p>
            <h3 className="display-font mt-2 text-2xl text-[#183d32]">{project.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#707a72]">{project.description}</p>
          </article>)}
        </div>
      </section>

      <section className="bg-[#183d32] px-5 py-20 text-center">
        <Users className="mx-auto mb-5 text-[#e0bd7e]" size={30}/>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#e0bd7e]">Be part of something meaningful</p>
        <h2 className="display-font mx-auto max-w-2xl text-4xl leading-tight text-white sm:text-5xl">Your time, your skills, your community.</h2>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-white/65">Find out how to get involved in the society's upcoming initiatives.</p>
        <Link to="/get-involved" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e0bd7e] px-6 py-3.5 text-sm font-bold text-[#183d32]">Get involved <ArrowUpRight size={16}/></Link>
      </section>
    </>
  );
}
import SectionHeading from "../components/SectionHeading.jsx";
import { Mail, Instagram, HandHeart } from "lucide-react";

export default function GetInvolved() {
  return <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
    <SectionHeading eyebrow="Take part" title="There is a place for you here." description="Interested in volunteering, collaborating or learning more? Use the society's official contact channels below once they are added." />
    <div className="mt-14 grid gap-5 md:grid-cols-2">
      <div className="border border-[#e1e2da] bg-white p-7"><HandHeart className="mb-6 text-[#668574]" size={26}/><h2 className="display-font text-2xl text-[#183d32]">Volunteer with us</h2><p className="mt-3 text-sm leading-7 text-[#68716b]">Add the official volunteer registration process or contact details here.</p></div>
      <div className="border border-[#e1e2da] bg-white p-7"><Mail className="mb-6 text-[#668574]" size={26}/><h2 className="display-font text-2xl text-[#183d32]">Connect with the society</h2><p className="mt-3 text-sm leading-7 text-[#68716b]">Add an approved society email address and social media account.</p><div className="mt-5 flex gap-4 text-sm text-[#183d32]"><span className="flex items-center gap-2"><Mail size={15}/>Email to be added</span><Instagram size={17}/></div></div>
    </div>
  </div>;
}
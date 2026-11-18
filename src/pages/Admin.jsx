import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Construction } from "lucide-react";

export default function Admin() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f1f1eb] px-5 py-12">
    <div className="w-full max-w-md rounded-xl border border-[#e1e3da] bg-white p-8 shadow-sm">
      <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-[#68716b] hover:text-[#183d32]"><ArrowLeft size={16}/> Back to website</Link>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf1eb] text-[#183d32]"><LockKeyhole size={22}/></div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#829084]">Society administration</p>
      <h1 className="display-font mt-2 text-3xl text-[#183d32]">Admin portal</h1>
      <div className="mt-7 rounded-lg bg-[#f6f5ef] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#46524a]"><Construction size={17}/> Under development</div><p className="mt-2 text-sm leading-6 text-[#737c74]">Authentication and the content-management dashboard will be implemented after the Supabase project and database security policies are configured.</p></div>
      <p className="mt-6 text-xs leading-5 text-[#929991]">This placeholder is not an authentication system. Do not enter credentials here.</p>
    </div>
  </main>;
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  LockKeyhole,
  Mail,
  LogOut,
  LoaderCircle,
  ShieldCheck,
  AlertCircle,
  LayoutDashboard,
  CalendarDays,
  Users,
  Images,
  Megaphone,
  Inbox,
  Settings,
  Plus,
  ArrowUpRight,
  Menu,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import EventsManager from "../components/admin/EventsManager";
// ---------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "events", label: "Events & Initiatives", icon: CalendarDays },
  { id: "team", label: "Our Team", icon: Users },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "enquiries", label: "Enquiries", icon: Inbox },
  { id: "settings", label: "Site Settings", icon: Settings },
];

function Dashboard({ profile, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [counts, setCounts] = useState({
    events: null,
    team: null,
    gallery: null,
    enquiries: null,
  });

  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCounts() {
      const tables = [
        ["events", "events"],
        ["team_members", "team"],
        ["gallery_items", "gallery"],
        ["enquiries", "enquiries"],
      ];

      const results = await Promise.all(
        tables.map(async ([table, key]) => {
          const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });

          return [key, error ? null : count];
        })
      );

      if (mounted) {
        setCounts(Object.fromEntries(results));
        setCountsLoading(false);
      }
    }

    loadCounts();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Events & Initiatives",
      value: counts.events,
      icon: CalendarDays,
      section: "events",
      description: "Manage society activities",
    },
    {
      label: "Team Members",
      value: counts.team,
      icon: Users,
      section: "team",
      description: "Manage office-bearers",
    },
    {
      label: "Gallery Images",
      value: counts.gallery,
      icon: Images,
      section: "gallery",
      description: "Manage photographs",
    },
    {
      label: "Enquiries",
      value: counts.enquiries,
      icon: Inbox,
      section: "enquiries",
      description: "Review submissions",
    },
  ];

  const activeItem = navigation.find(
    (item) => item.id === activeSection
  );

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252a26]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#e5e2da] bg-white">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a52d36] text-white">
              <ShieldCheck size={21} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">
                MCS <span className="text-[#a52d36]">|</span> CSS
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#929991]">
                Administration
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#f8e9e9] px-3 py-1.5 text-xs font-bold text-[#a52d36] sm:inline-block">
              {profile.role.replace("_", " ")}
            </span>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-[#deded7] bg-white px-3 py-2 text-sm font-semibold text-[#46524a] transition hover:border-[#a52d36] hover:text-[#a52d36]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-64px)] w-64 shrink-0 border-r border-[#e5e2da] bg-white p-5 md:block">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#929991]">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[#f8e9e9] text-[#a52d36]"
                      : "text-[#68716b] hover:bg-[#f7f6f2] hover:text-[#252a26]"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a52d36]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-12 rounded-xl bg-[#f7f6f2] p-4">
            <ShieldCheck size={20} className="text-[#a52d36]" />
            <p className="mt-3 text-xs font-bold text-[#252a26]">
              Secure administration
            </p>
            <p className="mt-1 text-xs leading-5 text-[#929991]">
              Only authorised society accounts can manage website content.
            </p>
          </div>

          <Link
            to="/"
            className="mt-8 flex items-center gap-2 px-3 text-xs font-semibold text-[#68716b] hover:text-[#a52d36]"
          >
            <ArrowLeft size={14} />
            Back to public website
          </Link>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          {/* Mobile navigation */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 md:hidden">
            <Menu size={18} className="shrink-0 text-[#929991]" />
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                    activeSection === item.id
                      ? "bg-[#a52d36] text-white"
                      : "border border-[#deded7] bg-white text-[#68716b]"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {activeSection === "overview" ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a52d36]">
                    Society administration
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight">
                    Dashboard overview
                  </h1>
                  <p className="mt-2 text-sm text-[#68716b]">
                    Manage your society website from one place.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-[#deded7] bg-white px-3 py-2 text-xs font-semibold text-[#68716b]">
                  <ShieldCheck size={15} className="text-[#a52d36]" />
                  Signed in as Super Admin
                </div>
              </div>

              {/* Statistics */}
              <section className="mt-9">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#46524a]">
                    Website at a glance
                  </h2>
                  {countsLoading && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin text-[#a52d36]"
                    />
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <button
                        key={stat.label}
                        onClick={() => setActiveSection(stat.section)}
                        className="rounded-xl border border-[#e5e2da] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c98c90] hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8e9e9] text-[#a52d36]">
                            <Icon size={20} />
                          </div>
                          <ArrowUpRight
                            size={17}
                            className="text-[#929991]"
                          />
                        </div>

                        <p className="mt-5 text-2xl font-bold">
                          {countsLoading
                            ? "..."
                            : stat.value === null
                              ? "—"
                              : stat.value}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#46524a]">
                          {stat.label}
                        </p>

                        <p className="mt-1 text-xs text-[#929991]">
                          {stat.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick actions */}
              <section className="mt-10">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#46524a]">
                  Quick actions
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      title: "Manage events",
                      description: "Create and update society events.",
                      icon: CalendarDays,
                      section: "events",
                    },
                    {
                      title: "Update team",
                      description: "Manage your society office-bearers.",
                      icon: Users,
                      section: "team",
                    },
                    {
                      title: "Upload photographs",
                      description: "Add new images to the gallery.",
                      icon: Images,
                      section: "gallery",
                    },
                  ].map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.title}
                        onClick={() => setActiveSection(action.section)}
                        className="flex items-start gap-4 rounded-xl border border-[#e5e2da] bg-white p-5 text-left transition hover:border-[#c98c90] hover:shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8e9e9] text-[#a52d36]">
                          <Icon size={19} />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-bold">
                            {action.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#929991]">
                            {action.description}
                          </p>
                        </div>

                        <ArrowUpRight
                          size={17}
                          className="text-[#929991]"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mt-10 rounded-xl border border-[#ead6d6] bg-[#fffafa] p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8e9e9] text-[#a52d36]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">
                      Welcome to your administration portal
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#68716b]">
                      Your administrator authentication is active. The
                      content management sections are being prepared and
                      will be connected to your Supabase database.
                    </p>
                  </div>
                </div>
              </section>
            </>
        ) : activeSection === "events" ? (
  <EventsManager />
) : (
  <section className="rounded-xl border border-[#e5e2da] bg-white p-8 shadow-sm">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8e9e9] text-[#a52d36]">
      {activeItem && <activeItem.icon size={23} />}
    </div>

    <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#a52d36]">
      Content management
    </p>

    <h1 className="mt-2 text-2xl font-bold">
      {activeItem?.label}
    </h1>

    <p className="mt-3 max-w-xl text-sm leading-6 text-[#68716b]">
      This section is part of the administration dashboard.
      We'll connect it to the database and build its management
      features in the next development steps.
    </p>

    <button
      onClick={() => setActiveSection("overview")}
      className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#a52d36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#85232b]"
    >
      <ArrowLeft size={16} />
      Return to overview
    </button>
  </section>
)}

          <footer className="mt-12 border-t border-[#e5e2da] pt-5 text-xs text-[#929991]">
            MCS Community Service Society · Administration Portal
          </footer>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------
// AUTHENTICATION
// ---------------------------------------------

export default function Admin() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (mounted) setError(error.message);
      } else if (mounted) {
        setSession(data.session);
      }

      if (mounted) setLoading(false);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null);
      return;
    }

    let mounted = true;

    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      if (error) {
        setError("Unable to verify your administrator account.");
        setProfile({ role: "unauthorized" });
        return;
      }

      if (!["super_admin", "editor"].includes(data.role)) {
        setProfile({ role: "unauthorized" });
        return;
      }

      setProfile(data);
      setError("");
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    }

    setSubmitting(false);
    setPassword("");
  }

  async function handleLogout() {
    setError("");
    const { error } = await supabase.auth.signOut();

    if (error) setError(error.message);
    setSession(null);
    setProfile(null);
  }

  const inputClass =
    "w-full rounded-lg border border-[#deded7] bg-white px-4 py-3 text-sm text-[#252a26] outline-none transition focus:border-[#a52d36]";

  if (loading || (session && !profile)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2]">
        <LoaderCircle className="animate-spin text-[#a52d36]" size={30} />
      </main>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#252a26]">
            Configuration missing
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#737c74]">
            Supabase environment variables have not been configured.
          </p>
        </div>
      </main>
    );
  }

  if (session && profile?.role === "unauthorized") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
          <ShieldCheck size={30} className="text-[#a52d36]" />
          <h1 className="mt-5 text-2xl font-bold text-[#252a26]">
            Access denied
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#737c74]">
            Your account does not have permission to access the administration portal.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-lg bg-[#a52d36] px-5 py-3 text-sm font-semibold text-white"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  if (session && profile) {
    return <Dashboard profile={profile} onLogout={handleLogout} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5 py-12">
      <div className="w-full max-w-md rounded-xl border border-[#e1e3da] bg-white p-8 shadow-sm">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#68716b] hover:text-[#a52d36]"
        >
          <ArrowLeft size={16} /> Back to website
        </Link>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8e9e9] text-[#a52d36]">
          <LockKeyhole size={22} />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#829084]">
          Society administration
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#252a26]">
          Admin portal
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#737c74]">
          Sign in to manage the MCS Community Service Society website.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#46524a]">
              Email address
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#929991]" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#46524a]">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-[#fdf0ef] p-3 text-sm text-[#a52d36]">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#a52d36] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#85232b] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in <LockKeyhole size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-[#929991]">
          Authorised society administrators only.
        </p>
      </div>
    </main>
  );
}

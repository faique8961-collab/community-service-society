import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, NavLink, Link, useParams, useLocation } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Menu, X, Instagram, HeartHandshake, HandHeart, Users } from 'lucide-react'
import { society } from './data/content'
import { supabase } from './lib/supabase'
import { usePublishedEvents } from './hooks/usePublishedEvents'

const Admin = lazy(() => import('./pages/Admin'))

function Header() {
  const [open, setOpen] = useState(false)
  const links = [['Home', '/'], ['About', '/about'], ['Events', '/events'], ['Our Team', '/team'], ['Gallery', '/gallery']]

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="MCS Community Service Society home">
        <img className="brand-society-logo" src="/images/branding/society-logo.webp" alt="MCS Community Service Society logo" onError={e => { e.currentTarget.style.display = 'none' }} />
        <img className="brand-university-logo" src="/images/branding/university-logo.webp" alt="Military College of Signals logo" onError={e => { e.currentTarget.style.display = 'none' }} />
        <span><strong>MCS COMMUNITY</strong><small>SERVICE SOCIETY</small></span>
      </Link>
      <nav className={open ? 'nav nav-open' : 'nav'}>
        {links.map(([name, path]) => (
          <NavLink end={path === '/'} key={path} to={path} onClick={() => setOpen(false)}>{name}</NavLink>
        ))}
        <Link className="nav-cta" to="/get-involved" onClick={() => setOpen(false)}>Volunteer <ArrowUpRight size={15} /></Link>
      </nav>
      <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? <X /> : <Menu />}
      </button>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <Link className="brand footer-brand" to="/">
          <img src="/images/branding/society-logo.webp" alt="MCS Community Service Society logo" />
          <span><strong>MCS COMMUNITY</strong><small>SERVICE SOCIETY</small></span>
        </Link>
        <p>For people. With purpose.<br />Through service.</p>
        <div className="footer-social">
          <a href="https://www.instagram.com/mcscommunityservice/" target="_blank" rel="noreferrer"><Instagram size={17} /> {society.handle}</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MCS Community Service Society</span>
        <Link to="/">Back to home ↑</Link>
        <span>EST. 2022 · MCS</span>
      </div>
    </footer>
  )
}

function PageHero({ eyebrow, title, description }) {
  return <section className="page-hero"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>
}

function SectionIntro({ kicker, title, text }) {
  return <div className="section-intro"><span className="eyebrow">{kicker}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>
}

function ActivityState({ loading, error, retry, emptyText = 'There are no published activities to display yet.' }) {
  if (loading) return <p className="activity-state" role="status">Loading activities…</p>
  if (error) {
    return (
      <div className="activity-state" role="alert">
        <p>{error}</p>
        <button className="button button-red" type="button" onClick={retry}>Try again</button>
      </div>
    )
  }
  return <p className="activity-state">{emptyText}</p>
}

function Home({ activities, loading, error, retry }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><i /> A student-led welfare initiative · Est. 2022</span>
          <h1>Small acts.<br /><em>Lasting</em> impact.</h1>
          <p>We bring people together to make compassion practical — supporting vulnerable communities through service, generosity, and collective action.</p>
          <div className="hero-actions">
            <Link className="button button-red" to="/events">Explore our work <ArrowRight size={17} /></Link>
            <Link className="text-link" to="/about">Discover our story <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-note"><span className="note-line" />For people. With purpose. Through service.</div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo">
            <img src="/images/initiatives/clothing-drive-2026-3.jpg" alt="MCS volunteers at the 2026 clothing drive" />
            <div className="photo-caption"><span>COMMUNITY IN ACTION · 2026</span><strong>Giving, together.</strong></div>
          </div>
          <div className="hero-stamp"><HeartHandshake size={25} /><span>Khidmat-e-Khalq</span></div>
          <div className="hero-side-label">MCS · COMMUNITY SERVICE SOCIETY</div>
        </div>
      </section>

      <section className="home-intro section-pad">
        <div className="home-intro-mark">
          <img src="/images/branding/university-logo.webp" alt="Military College of Signals logo" />
          <span>MILITARY COLLEGE OF SIGNALS · RAWALPINDI</span>
        </div>
        <div>
          <SectionIntro kicker="Who we are" title={<>Service is not a moment.<br /><em>It is a commitment.</em></>} text={society.history} />
          <Link className="inline-more" to="/about">More about the society <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="home-events section-pad">
        <div className="section-head-row">
          <SectionIntro kicker="Events & initiatives" title={<>A record of showing up.</>} text="Explore the society's drives, outreach initiatives, seminars, ceremonies, and shared moments." />
          <Link className="inline-more" to="/events">Explore all activities <ArrowRight size={16} /></Link>
        </div>
        {loading || error ? (
          <ActivityState loading={loading} error={error} retry={retry} />
        ) : activities.length ? (
          <div className="event-grid">{activities.slice(0, 3).map(event => <EventCard key={event.id} event={event} />)}</div>
        ) : (
          <ActivityState emptyText="Our activities will appear here once they are published." />
        )}
      </section>
      <JoinBand />
    </>
  )
}

function About() {
  return (
    <>
      <PageHero eyebrow="Our story" title={<>Rooted in service.<br /><em>Driven by compassion.</em></>} description="A student-led welfare initiative bringing the MCS community together through practical acts of care." />
      <section className="about-page section-pad">
        <div className="about-logo-panel"><img src="/images/branding/university-logo.webp" alt="Military College of Signals" /><span>ESTABLISHED 2022</span></div>
        <div>
          <SectionIntro kicker="Our beginnings" title="A society built around service." text={society.history} />
          <div className="mission-card"><span className="mission-icon"><HandHeart size={22} /></span><div><span className="eyebrow">Our mission</span><p>{society.mission}</p></div></div>
        </div>
      </section>
      <section className="values-band">
        <SectionIntro kicker="Our approach" title="Compassion, made practical." text="We focus on responding to real needs with thoughtful, collective action." />
        <div className="value-grid">
          <div><HeartHandshake /><h3>Human dignity</h3><p>Supporting people with care, respect, and consideration.</p></div>
          <div><Users /><h3>Collective effort</h3><p>Bringing students and the wider community together.</p></div>
          <div><HandHeart /><h3>Meaningful service</h3><p>Turning good intentions into practical assistance.</p></div>
        </div>
      </section>
    </>
  )
}

function EventCard({ event }) {
  return (
    <article className="event-card">
      <Link to={`/events/${event.id}`} className="event-image">
        {event.images?.[0] ? <img src={event.images[0]} alt={event.title} /> : <div className="empty-photo">Photo coming soon</div>}
        {event.date && <span>{event.date}</span>}
      </Link>
      <div className="event-card-copy">
        <span className="eyebrow">{event.location || 'MCS Community Service Society'}</span>
        <h3>{event.title}</h3>
        <p>{event.summary || event.description}</p>
        <Link to={`/events/${event.id}`} className="inline-more">View activity <ArrowRight size={15} /></Link>
      </div>
    </article>
  )
}

function EventsPage({ activities, loading, error, retry }) {
  return (
    <>
      <PageHero eyebrow="Events & initiatives" title={<>Moments that make<br /><em>the mission visible.</em></>} description="A combined archive of the society's events, relief drives, outreach initiatives, and community activities." />
      <section className="section-pad page-content">
        {loading || error ? (
          <ActivityState loading={loading} error={error} retry={retry} />
        ) : activities.length ? (
          <div className="event-grid">{activities.map(event => <EventCard key={event.id} event={event} />)}</div>
        ) : (
          <ActivityState emptyText="There are no published activities yet. Please check back soon." />
        )}
      </section>
    </>
  )
}

function EventDetail({ activities, loading, error, retry }) {
  const { id } = useParams()
  const event = activities.find(item => item.id === id)

  if (loading || error) {
    return <section className="section-pad page-content"><ActivityState loading={loading} error={error} retry={retry} /></section>
  }

  if (!event) return <NotFound />

  const eyebrow = [event.date, event.location].filter(Boolean).join(' · ') || 'Events & initiatives'

  return (
    <>
      <PageHero eyebrow={eyebrow} title={event.title} description={event.description || event.summary || 'An activity by the MCS Community Service Society.'} />
      <section className="section-pad">
        <div className="detail-gallery event-detail-gallery">
          {event.images?.length ? event.images.map(src => <img key={src} src={src} alt={`${event.title} photograph`} />) : <div className="empty-photo">Photographs for this activity will be added here.</div>}
        </div>
        <Link className="inline-more" to="/events">← Back to events & initiatives</Link>
      </section>
    </>
  )
}

function PersonCard({ person, index, featured = false }) {
  return (
    <article className={featured ? 'person-card person-card-featured' : 'person-card'}>
      <div className="person-photo" style={person.image_url ? { aspectRatio: (person.image_aspect_ratio || '3:4').replace(':', ' / '), height: 'auto' } : undefined}>
        {person.image_url ? (
          <img src={person.image_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <div className="photo-placeholder"><Users size={30} /><span>PHOTO</span></div>
        )}
        <span className="person-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="person-details"><span className="person-role">{person.position}</span><h3>{person.name}</h3>{person.bio && <p>{person.bio}</p>}</div>
    </article>
  )
}

function TeamRow({ title, people, startIndex = 0 }) {
  if (!people.length) return null
  return (
    <section className="team-group">
      <div className="team-group-heading"><span className="eyebrow">Executive committee</span><h2>{title}</h2></div>
      <div className="team-row">{people.map((person, index) => <PersonCard key={person.id} person={person} index={startIndex + index} />)}</div>
    </section>
  )
}

function Team() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadTeam() {
      if (!supabase) {
        if (mounted) { setError('The team directory is temporarily unavailable.'); setLoading(false) }
        return
      }
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('id, name, position, bio, image_url, image_aspect_ratio, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (!mounted) return
      if (fetchError) setError('We could not load the team directory. Please try again later.')
      else setMembers(data || [])
      setLoading(false)
    }
    loadTeam()
    return () => { mounted = false }
  }, [])

  const president = members.filter(person => person.position.trim().toLowerCase() === 'president')
  const vicePresidents = members.filter(person => person.position.trim().toLowerCase() === 'vice president')
  const generalSecretaries = members.filter(person => person.position.trim().toLowerCase() === 'general secretary')
  const jointSecretaries = members.filter(person => person.position.trim().toLowerCase().startsWith('joint secretary'))
  const eventSecretaries = members.filter(person => person.position.trim().toLowerCase() === 'secretary events')
  const mediaSecretaries = members.filter(person => person.position.toLowerCase().includes('media'))
  const financeSecretaries = members.filter(person => person.position.trim().toLowerCase() === 'secretary finance')
  const groupedIds = new Set([...president, ...vicePresidents, ...generalSecretaries, ...jointSecretaries, ...eventSecretaries, ...mediaSecretaries, ...financeSecretaries].map(person => person.id))
  const otherMembers = members.filter(person => !groupedIds.has(person.id))
  const indexOf = person => members.findIndex(member => member.id === person?.id)

  return (
    <>
      <PageHero eyebrow="The people behind the purpose" title={<>A community built<br /><em>by people who care.</em></>} description="Meet the Main Panel of the MCS Community Service Society for the 2026–27 session." />
      <section className="section-pad page-content team-page">
        <div className="main-panel-label"><span className="eyebrow">2026–27 session</span><h2>Main Panel</h2><p>The elected office-bearers and appointed secretaries leading the society's work.</p></div>
        {loading ? <div className="activity-state" role="status">Loading team members…</div> : error ? <div className="activity-state" role="alert">{error}</div> : members.length === 0 ? <div className="activity-state">The team directory will be updated soon.</div> : <>
          <div className="president-feature">{president.map(person => <PersonCard key={person.id} person={person} index={indexOf(person)} featured />)}</div>
          <TeamRow title="Vice Presidents" people={vicePresidents} startIndex={indexOf(vicePresidents[0])} />
          <TeamRow title="General Secretaries" people={generalSecretaries} startIndex={indexOf(generalSecretaries[0])} />
          <TeamRow title="Joint Secretaries" people={jointSecretaries} startIndex={indexOf(jointSecretaries[0])} />
          <TeamRow title="Secretary Events" people={eventSecretaries} startIndex={indexOf(eventSecretaries[0])} />
          <TeamRow title="Secretary Media" people={mediaSecretaries} startIndex={indexOf(mediaSecretaries[0])} />
          <TeamRow title="Secretary Finance" people={financeSecretaries} startIndex={indexOf(financeSecretaries[0])} />
          <TeamRow title="Other Office-Bearers" people={otherMembers} startIndex={indexOf(otherMembers[0])} />
        </>}
      </section>
    </>
  )
}

function Gallery({ activities, loading, error, retry }) {
  const allImages = activities.flatMap(event => event.images.map(src => ({ src, title: event.title })))
  const uniqueImages = [...new Map(allImages.map(item => [item.src, item])).values()]

  return (
    <>
      <PageHero eyebrow="Photo archive" title={<>Service, seen<br /><em>through our moments.</em></>} description="A selection of photographs from the society's initiatives, events, and community activities." />
      <section className="section-pad page-content">
        {loading || error ? (
          <ActivityState loading={loading} error={error} retry={retry} />
        ) : uniqueImages.length ? (
          <div className="gallery-grid">{uniqueImages.map(item => <figure key={item.src}><img src={item.src} alt={item.title} /><figcaption>{item.title}</figcaption></figure>)}</div>
        ) : (
          <ActivityState emptyText="There are no published activity photographs yet." />
        )}
      </section>
    </>
  )
}

function GetInvolved() {
  const referencePhone = '+92 300 000 0000'
  const phoneLink = 'tel:+923000000000'

  return (
    <>
      <PageHero eyebrow="Be part of something meaningful" title={<>Good grows when<br /><em>we grow it together.</em></>} description="Interested in volunteering, contributing, or collaborating? Get in touch with the MCS Community Service Society." />
      <section className="section-pad volunteer-page">
        <div className="volunteer-intro">
          <SectionIntro kicker="Volunteer with us" title="Your time can make a difference." text="Follow our official Instagram page for announcements and opportunities, or contact the society's President or General Secretary for volunteer enquiries." />
          <a className="button button-red" href="https://www.instagram.com/mcscommunityservice/" target="_blank" rel="noreferrer"><Instagram size={17} /> {society.handle} <ArrowUpRight size={16} /></a>
        </div>
        <div className="contact-card-grid">
          <article className="contact-card"><span className="eyebrow">Contact the President</span><h3>Omer Nadeem</h3><a href={phoneLink}>{referencePhone}</a><small>Temporary reference number — replace with the official contact before publishing.</small></article>
          <article className="contact-card"><span className="eyebrow">Contact the General Secretary</span><h3>Hanya Yousaf</h3><a href={phoneLink}>{referencePhone}</a><small>Temporary reference number — replace with the official contact before publishing.</small></article>
        </div>
      </section>
    </>
  )
}

function JoinBand() {
  return (
    <section className="join-section">
      <div className="join-pattern" />
      <div className="join-content">
        <span className="eyebrow">Be part of something meaningful</span>
        <h2>Good grows when<br /><em>we grow it together.</em></h2>
        <p>Volunteer, contribute, collaborate, or simply learn more about what we do.</p>
        <Link className="button button-white" to="/get-involved">Get involved <ArrowUpRight size={17} /></Link>
      </div>
      <div className="join-seal"><HeartHandshake size={56} /><span>GIVE · SERVE · GROW</span></div>
    </section>
  )
}

function NotFound() {
  return <PageHero eyebrow="404" title="Page not found" description="The page you're looking for doesn't exist or may have moved." />
}

function AppShell() {
  const { pathname } = useLocation()
  const { events: activities, loading, error, retry } = usePublishedEvents()

  // Reset the scroll position whenever the user navigates to a new page.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home activities={activities} loading={loading} error={error} retry={retry} />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<EventsPage activities={activities} loading={loading} error={error} retry={retry} />} />
          <Route path="/events/:id" element={<EventDetail activities={activities} loading={loading} error={error} retry={retry} />} />
          <Route path="/team" element={<Team />} />
          <Route path="/gallery" element={<Gallery activities={activities} loading={loading} error={error} retry={retry} />} />
          <Route path="/get-involved" element={<GetInvolved />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function AdminLoading() {
  return <div className="activity-state" role="status">Loading admin dashboard…</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<Suspense fallback={<AdminLoading />}><Admin /></Suspense>} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}

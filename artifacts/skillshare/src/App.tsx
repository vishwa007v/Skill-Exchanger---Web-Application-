import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Clock3,
  Compass,
  FileQuestion,
  Film,
  GraduationCap,
  Layers3,
  LogOut,
  Menu,
  Plus,
  Play,
  Presentation,
  Search,
  Sparkles,
  Star,
  Moon,
  Sun,
  Users,
  X,
} from 'lucide-react';
import {
  ContentBlockType,
  CourseInputLevel,
  type ContentBlock,
  type Course,
  type CourseInput,
} from '@workspace/api-client-react';
import {
  getGetCourseQueryKey,
  getGetTeacherSummaryQueryKey,
  getListCoursesQueryKey,
  useCompleteCourse,
  useCreateCourse,
  useGetCourse,
  useGetTeacherSummary,
  useListCourses,
  useRateCourse,
} from '@workspace/api-client-react';
import {
  Link,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
  useParams,
} from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const hasClerk = Boolean(clerkPubKey);

const demoCourses: Course[] = [
  {
    id: 'field-notes-for-ux',
    title: 'Field Notes for Better UX',
    description: 'A practical studio on noticing what people do, not just what they say.',
    category: 'Design',
    level: 'intermediate',
    instructor: 'Mina Park',
    instructorInitials: 'MP',
    rating: 5,
    ratingCount: 128,
    duration: 142,
    students: 1840,
    accent: '#14B8C4',
    createdAt: '2025-02-18T00:00:00.000Z',
    contents: [
      { id: 'ux-1', type: ContentBlockType.video, title: 'Start with the edges', description: 'Learn to spot the quiet moments where products lose people.', duration: 18, source: null, questions: [] },
      { id: 'ux-2', type: ContentBlockType.presentation, title: 'The observation sheet', description: 'A lightweight framework for turning messy notes into useful signals.', duration: 24, source: null, questions: [] },
      { id: 'ux-3', type: ContentBlockType.quiz, title: 'See the signal', description: 'A short check-in to make the method stick.', duration: 8, source: null, questions: [{ prompt: 'What makes an observation useful?', options: ['Its length', 'Its specificity', 'Its polish'], answer: 1 }] },
    ],
  },
  {
    id: 'clearer-presentations',
    title: 'Presentations People Remember',
    description: 'Build a clear point of view, then make the room care about it.',
    category: 'Communication',
    level: 'beginner',
    instructor: 'Theo Nwosu',
    instructorInitials: 'TN',
    rating: 4.9,
    ratingCount: 93,
    duration: 96,
    students: 1120,
    accent: '#7B6FE8',
    createdAt: '2025-01-30T00:00:00.000Z',
    contents: [
      { id: 'pres-1', type: ContentBlockType.video, title: 'One room, one idea', description: 'A warm-up for cutting the noise from your next talk.', duration: 16, source: null, questions: [] },
      { id: 'pres-2', type: ContentBlockType.presentation, title: 'A deck with a spine', description: 'A visual walkthrough of a presentation that holds together.', duration: 31, source: null, questions: [] },
    ],
  },
  {
    id: 'money-without-mystery',
    title: 'Money Without the Mystery',
    description: 'A calm, practical reset for building a money system you will actually use.',
    category: 'Life admin',
    level: 'beginner',
    instructor: 'Jules Rivera',
    instructorInitials: 'JR',
    rating: 4.8,
    ratingCount: 76,
    duration: 121,
    students: 870,
    accent: '#50C7B7',
    createdAt: '2025-02-06T00:00:00.000Z',
    contents: [
      { id: 'money-1', type: ContentBlockType.presentation, title: 'Your month at a glance', description: 'See where the money goes before you ask it to change.', duration: 22, source: null, questions: [] },
      { id: 'money-2', type: ContentBlockType.quiz, title: 'Make the next decision', description: 'Test the simple rules behind a calmer cash flow.', duration: 10, source: null, questions: [{ prompt: 'What should a money system do first?', options: ['Judge you', 'Create visibility', 'Optimize every purchase'], answer: 1 }] },
    ],
  },
  {
    id: 'woodworking-first-joint',
    title: 'Your First Clean Joint',
    description: 'Make a useful thing from a few boards and a little patience.',
    category: 'Making',
    level: 'beginner',
    instructor: 'Rafi Okafor',
    instructorInitials: 'RO',
    rating: 4.7,
    ratingCount: 58,
    duration: 188,
    students: 642,
    accent: '#4FA3B1',
    createdAt: '2025-01-12T00:00:00.000Z',
    contents: [
      { id: 'wood-1', type: ContentBlockType.video, title: 'Read the grain', description: 'The small orientation choice that makes the rest easier.', duration: 25, source: null, questions: [] },
      { id: 'wood-2', type: ContentBlockType.video, title: 'Cut, dry-fit, adjust', description: 'A patient walkthrough of the first real joint.', duration: 42, source: null, questions: [] },
    ],
  },
];

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2.5" data-testid="link-logo">
      <img src={`${basePath}/logo.svg`} alt="Skill Exchanger" className="h-9 w-9" data-testid="img-logo" />
      <span className={`font-serif text-xl font-bold tracking-[-0.04em] ${inverse ? 'text-[hsl(var(--background))]' : 'text-foreground'}`}>skill exchanger</span>
    </Link>
  );
}

function Avatar({ initials, accent = '#14B8C4' }: { initials: string; accent?: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-foreground" style={{ backgroundColor: accent }} data-testid={`avatar-${initials}`}>
      {initials}
    </span>
  );
}

function StarRating({ rating, count, compact = false }: { rating: number; count?: number; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`} data-testid="rating-course">
      <Star className="h-3.5 w-3.5 fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
      <strong>{rating.toFixed(1)}</strong>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => window.localStorage.getItem('skill-exchanger-theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('skill-exchanger-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((current) => !current)}
      className="focus-ring fixed right-5 top-5 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition-transform hover:-translate-y-0.5"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="button-theme-toggle"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function PublicNav() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
      <Logo />
      <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
        <a href="#how-it-works" className="transition-colors hover:text-foreground" data-testid="link-how-it-works">How it works</a>
        <a href="#for-teachers" className="transition-colors hover:text-foreground" data-testid="link-for-teachers">For teachers</a>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/sign-in" className="focus-ring rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted" data-testid="link-sign-in">Sign in</Link>
        <Link href="/sign-up" className="focus-ring rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">Start learning</Link>
      </div>
    </header>
  );
}

function LandingPage() {
  return (
    <main className="studio-grain min-h-[100dvh] overflow-hidden">
      <PublicNav />
      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
        <div className="studio-rise relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-card/70 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> practical learning, thoughtfully taught
          </div>
          <h1 className="max-w-3xl font-serif text-[clamp(3.8rem,8vw,7.8rem)] font-semibold leading-[.88] tracking-[-0.075em] text-foreground">
            Learn the thing.<br /><span className="text-[hsl(var(--accent))]">Make it yours.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            Skill Exchanger is a focused studio for useful knowledge — taught by people who have done the work and want to show you how.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className="focus-ring group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground transition-transform hover:-translate-y-1" data-testid="link-hero-sign-up">
              Find your next skill <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/portal" className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 font-semibold transition-colors hover:bg-muted" data-testid="link-hero-portal">
              Preview the studio
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              <Avatar initials="MP" accent="#14B8C4" /><Avatar initials="TN" accent="#7B6FE8" /><Avatar initials="JR" accent="#50C7B7" />
            </div>
            <span><strong className="text-foreground">2,400+</strong> curious people learning in public</span>
          </div>
        </div>
        <div className="studio-rise studio-rise-delay-2 relative min-h-[420px] lg:min-h-[600px]">
          <div className="absolute right-4 top-2 h-[76%] w-[76%] rounded-[3rem] bg-[hsl(var(--primary))] lg:right-10" />
          <div className="absolute bottom-10 left-4 z-10 w-[74%] rotate-[-4deg] rounded-[2rem] border-2 border-foreground/15 bg-card p-5 shadow-xl lg:left-2">
            <div className="course-swatch flex aspect-[1.3/1] items-end rounded-[1.35rem] p-5" style={{ '--swatch': '#0B3141' } as React.CSSProperties}>
              <div className="flex w-full items-end justify-between text-background">
                <div><p className="font-mono text-[10px] uppercase tracking-[.18em] opacity-70">Studio session 01</p><p className="mt-2 font-serif text-2xl font-semibold leading-none">Field notes<br />for better UX</p></div>
                <span className="rounded-full bg-background/15 p-3"><Play className="h-5 w-5 fill-current" /></span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4"><div><p className="text-sm font-bold">Mina Park</p><p className="text-xs text-muted-foreground">Design · 2h 22m</p></div><StarRating rating={5} compact /></div>
          </div>
          <div className="absolute right-0 top-20 z-20 w-44 rotate-[7deg] rounded-2xl border-2 border-foreground/15 bg-card p-4 shadow-lg lg:right-4">
            <div className="mb-8 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">your shelf</span><BookOpen className="h-4 w-4" /></div>
            <div className="h-2 rounded-full bg-muted"><div className="h-full w-[68%] rounded-full bg-[hsl(var(--accent))]" /></div>
            <p className="mt-3 text-xs font-semibold">68% of the way there</p>
          </div>
          <div className="absolute bottom-0 right-[10%] z-20 flex rotate-[-8deg] items-center gap-3 rounded-2xl border-2 border-foreground/15 bg-[hsl(var(--secondary))] px-4 py-3 shadow-lg">
            <Sparkles className="h-5 w-5" /><span className="font-mono text-[10px] font-bold uppercase tracking-[.14em]">keep going</span>
          </div>
          <div className="absolute -left-2 top-24 h-20 w-20 animate-[studio-drift_5s_ease-in-out_infinite_alternate] rounded-full border-2 border-dashed border-[hsl(var(--accent))] lg:left-0" />
        </div>
      </section>
      <section id="how-it-works" className="border-y border-border bg-card/50 px-5 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent-foreground))]">A better kind of course platform</p><h2 className="mt-4 max-w-sm font-serif text-4xl leading-tight tracking-[-.045em] md:text-5xl">Less noise.<br />More doing.</h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Trust the teacher', 'Find useful courses from people with real practice, not just a polished bio.'],
              ['02', 'Learn in the mix', 'Watch, read, and test your way through ideas so they stay with you.'],
              ['03', 'Leave with momentum', 'Finish with something you can use before the tab gets cold.'],
            ].map(([number, title, body]) => <div key={number} className="rounded-2xl border border-border bg-background p-5 transition-transform hover:-translate-y-1"><span className="font-mono text-xs font-bold text-[hsl(var(--accent-foreground))]">{number}</span><h3 className="mt-12 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></div>)}
          </div>
        </div>
      </section>
      <section id="for-teachers" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:px-10 lg:py-28">
        <div className="rounded-[2rem] bg-foreground p-8 text-background md:p-12"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">For teachers</p><h2 className="mt-5 max-w-lg font-serif text-5xl leading-[.96] tracking-[-.06em] md:text-6xl">Your useful knowledge belongs somewhere useful.</h2><p className="mt-6 max-w-md text-base leading-7 text-background/70">Publish the workshop you wish you had. Build a course from videos, presentations, and small moments of practice.</p><Link href="/teacher/new" className="focus-ring mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground" data-testid="link-teacher-cta">Build a course <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="flex flex-col justify-end rounded-[2rem] border border-border bg-[hsl(var(--secondary))] p-8"><div className="mb-14 flex items-center justify-between"><span className="rounded-full bg-background/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.14em]">teacher studio</span><Layers3 className="h-5 w-5" /></div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Published this month</p><p className="mt-2 font-serif text-7xl tracking-[-.08em]">24</p><div className="mt-5 flex items-center gap-2 text-sm font-semibold"><ArrowRight className="h-4 w-4" /> people are learning from it</div></div>
      </section>
      <footer className="border-t border-border px-5 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"><Logo /><span>Made for the people who keep learning.</span></div></footer>
    </main>
  );
}

function AppHeader({ teacher = false }: { teacher?: boolean }) {
  const { user } = useUserSafe();
  const { signOut } = useClerkSafe();
  const initials = user?.firstName?.slice(0, 1) || user?.emailAddresses?.[0]?.emailAddress.slice(0, 1).toUpperCase() || 'SK';
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-10">
        <div className="flex items-center gap-8"><Logo /><nav className="hidden items-center gap-1 md:flex">{[['/learner', 'Discover'], ['/teacher', 'Teach']].map(([href, label]) => <Link key={href} href={href} className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted ${teacher === (href === '/teacher') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`} data-testid={`link-nav-${label.toLowerCase()}`}>{label}</Link>)}</nav></div>
        <div className="flex items-center gap-3"><button type="button" className="focus-ring rounded-full p-2 text-muted-foreground hover:bg-muted md:hidden" onClick={() => document.getElementById('mobile-nav')?.classList.toggle('hidden')} data-testid="button-mobile-menu"><Menu className="h-5 w-5" /></button><span className="hidden text-right text-sm md:block"><strong className="block">{user?.firstName || 'Learner'}</strong><span className="text-xs text-muted-foreground">{teacher ? 'Teacher studio' : 'Learning shelf'}</span></span><Avatar initials={initials} accent="#14B8C4" /><button type="button" className="focus-ring hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted md:block" onClick={() => signOut()} data-testid="button-sign-out"><LogOut className="h-4 w-4" /></button></div>
      </div>
      <div id="mobile-nav" className="hidden border-t border-border bg-card px-5 py-3 md:hidden"><div className="flex gap-2"><Link href="/learner" className="rounded-full bg-muted px-3 py-2 text-sm font-semibold" data-testid="link-mobile-discover">Discover</Link><Link href="/teacher" className="rounded-full bg-muted px-3 py-2 text-sm font-semibold" data-testid="link-mobile-teach">Teach</Link></div></div>
    </header>
  );
}

function useUserSafe() {
  try { return useUser(); } catch { return { user: null }; }
}

function useClerkSafe() {
  try { return useClerk(); } catch { return { signOut: () => undefined }; }
}

function PortalPage() {
  return (
    <main className="studio-grain min-h-[100dvh] bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10"><Logo inverse /><Link href="/" className="text-sm font-semibold text-background/70 hover:text-background" data-testid="link-portal-home">Back to home</Link></div>
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-16 lg:px-10 lg:pb-28 lg:pt-24"><div className="studio-rise"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Choose your studio</p><h1 className="mt-5 max-w-2xl font-serif text-6xl leading-[.92] tracking-[-.07em] md:text-8xl">What are you here to make?</h1><p className="mt-7 max-w-xl text-lg leading-8 text-background/65">You can switch between learning and teaching whenever the mood strikes.</p></div><div className="mt-16 grid gap-5 md:grid-cols-2"><Link href="/learner" className="studio-rise studio-rise-delay-1 group focus-ring rounded-[2rem] bg-primary p-7 text-primary-foreground transition-transform hover:-translate-y-2 md:p-9" data-testid="link-portal-learner"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/10"><Compass className="h-6 w-6" /></div><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></div><h2 className="mt-20 font-serif text-4xl tracking-[-.05em]">I want to learn</h2><p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/75">Find a clear next step from teachers who know the way there.</p></Link><Link href="/teacher" className="studio-rise studio-rise-delay-2 group focus-ring rounded-[2rem] bg-background p-7 text-foreground transition-transform hover:-translate-y-2 md:p-9" data-testid="link-portal-teacher"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"><GraduationCap className="h-6 w-6" /></div><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></div><h2 className="mt-20 font-serif text-4xl tracking-[-.05em]">I want to teach</h2><p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Turn your practical knowledge into a course people can use.</p></Link></div></section>
    </main>
  );
}

function CourseCard({ course }: { course: Course }) {
  return <Link href={`/learner/course/${course.id}`} className="focus-ring group block rounded-[1.35rem] border border-border bg-card p-3 transition-transform hover:-translate-y-1.5 hover:shadow-lg" data-testid={`card-course-${course.id}`}><div className="course-swatch relative flex aspect-[1.45/1] items-end overflow-hidden rounded-[1rem] p-4" style={{ '--swatch': course.accent } as React.CSSProperties}><span className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-foreground">{levelLabel[course.level]}</span><div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/15 text-background backdrop-blur-sm transition-transform group-hover:scale-110"><Play className="ml-0.5 h-4 w-4 fill-current" /></div></div><div className="px-2 pb-2 pt-4"><p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{course.category}</p><h3 className="mt-2 line-clamp-2 min-h-[3.5rem] font-serif text-[1.45rem] leading-[1.05] tracking-[-.04em]">{course.title}</h3><div className="mt-4 flex items-center gap-2"><Avatar initials={course.instructorInitials} accent={course.accent} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{course.instructor}</p><div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground"><StarRating rating={course.rating} count={course.ratingCount} compact /><span>·</span><span>{Math.floor(course.duration / 60)}h {course.duration % 60}m</span></div></div></div></div></Link>;
}

function LearnerPage() {
  const [search, setSearch] = useState('');
  const params = useMemo(() => ({ search: search || undefined, sort: 'rating' as const }), [search]);
  const coursesQuery = useListCourses(params);
  const courses = coursesQuery.data ?? (coursesQuery.isError ? demoCourses : []);
  return <div className="min-h-[100dvh]"><AppHeader /><main className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div className="studio-rise"><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent-foreground))]">The learning shelf</p><h1 className="mt-3 font-serif text-5xl tracking-[-.06em] md:text-7xl">Start with something useful.</h1><p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">A considered collection of courses for the skills that keep paying you back.</p></div><div className="relative w-full md:w-80"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the shelf" className="focus-ring h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search-courses" /></div></div><div className="mt-14 flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />Top rated courses</div><span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{courses.length} courses · sorted by rating</span></div>{coursesQuery.isLoading ? <CourseGridSkeleton /> : courses.length === 0 ? <EmptyState title="Nothing on this shelf yet" body="Try a broader search, or come back for the next studio drop." /> : <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{courses.map((course, index) => <div key={course.id} className={`studio-rise studio-rise-delay-${Math.min(index + 1, 3)}`}><CourseCard course={course} /></div>)}</div>}{coursesQuery.isError && <p className="mt-5 text-xs text-muted-foreground" data-testid="status-demo-mode">Showing the studio sample shelf while the course service reconnects.</p>}</main></div>;
}

function CourseGridSkeleton() {
  return <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="rounded-[1.35rem] border border-border bg-card p-3"><div className="aspect-[1.45/1] animate-pulse rounded-[1rem] bg-muted" /><div className="space-y-3 px-2 pb-3 pt-4"><div className="h-2 w-20 animate-pulse rounded bg-muted" /><div className="h-10 animate-pulse rounded bg-muted" /><div className="h-8 animate-pulse rounded bg-muted" /></div></div>)}</div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="my-16 rounded-[2rem] border border-dashed border-border bg-card p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"><BookOpen className="h-5 w-5" /></div><h2 className="mt-5 font-serif text-3xl">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p></div>;
}

function BlockIcon({ type }: { type: string }) {
  if (type === ContentBlockType.video) return <Film className="h-4 w-4" />;
  if (type === ContentBlockType.presentation) return <Presentation className="h-4 w-4" />;
  return <FileQuestion className="h-4 w-4" />;
}

function CourseDetailPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const courseQuery = useGetCourse(courseId, { query: { queryKey: getGetCourseQueryKey(courseId) } });
  const course = courseQuery.data ?? demoCourses.find((item) => item.id === courseId) ?? demoCourses[0];
  const completeMutation = useCompleteCourse();
  const rateMutation = useRateCourse();
  const queryClient = useQueryClient();
  const [activeBlock, setActiveBlock] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  // Restore user completion & rating progress from backend on load
  useEffect(() => {
    if (!course?.id) return;
    fetch(`${basePath}/api/courses/${course.id}/progress`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.completed) setCompleted(true);
          if (data.rated) {
            setRated(true);
            if (data.userRating) setRating(data.userRating);
          }
        }
      })
      .catch(() => {});
  }, [course?.id]);

  const active = course.contents[activeBlock] ?? course.contents[0];

  const markComplete = () => {
    setErrorMessage(null);
    completeMutation.mutate(
      { courseId: course.id },
      {
        onSuccess: () => {
          setCompleted(true);
          queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(course.id) });
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ sort: 'rating' }) });
        },
        onError: (err: any) => {
          setErrorMessage(err?.data?.error || err?.message || 'Could not complete course. Please try again.');
        },
      }
    );
  };

  const submitRating = () => {
    if (!rating) return;
    setErrorMessage(null);
    rateMutation.mutate(
      { courseId: course.id, data: { rating } },
      {
        onSuccess: () => {
          setRated(true);
          queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(course.id) });
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ sort: 'rating' }) });
        },
        onError: (err: any) => {
          setErrorMessage(err?.data?.error || err?.message || 'Could not submit rating. Please try again.');
        },
      }
    );
  };

  const handleVerifyQuiz = () => {
    if (!active?.questions || active.questions.length === 0) return;
    let score = 0;
    active.questions.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.answer) {
        score += 1;
      }
    });
    const total = active.questions.length;
    setQuizScore({ score, total, passed: score >= Math.ceil(total * 0.6) });
  };

  if (courseQuery.isLoading)
    return (
      <div className="min-h-[100dvh]">
        <AppHeader />
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-10">
          <div className="h-12 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-80 animate-pulse rounded-[2rem] bg-muted" />
        </div>
      </div>
    );

  return (
    <div className="min-h-[100dvh]">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
        <Link
          href="/learner"
          className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          data-testid="link-back-courses"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the shelf
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <section>
            <div
              className="course-swatch relative flex min-h-[360px] items-end overflow-hidden rounded-[2rem] p-7 md:min-h-[490px] md:p-10"
              style={{ '--swatch': course.accent } as React.CSSProperties}
            >
              <div className="absolute right-12 top-10 h-36 w-36 rounded-full border border-background/20" />
              <div className="absolute right-24 top-24 h-20 w-20 rounded-full bg-background/10" />
              <div className="relative max-w-xl text-background">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[.2em]">
                  {course.category} · {levelLabel[course.level]}
                </span>
                <h1 className="mt-4 font-serif text-5xl leading-[.94] tracking-[-.06em] md:text-7xl">
                  {course.title}
                </h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-background/80">
                  {course.description}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <Avatar initials={course.instructorInitials} accent="#F4AD4B" />
                    {course.instructor}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" />
                    {Math.floor(course.duration / 60)}h {course.duration % 60}m
                  </span>
                  <StarRating rating={course.rating} count={course.ratingCount} />
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
                    Course path
                  </p>
                  <h2 className="mt-1 font-serif text-3xl tracking-[-.04em]">
                    Move through the studio
                  </h2>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {course.contents.length} parts
                </span>
              </div>
              <div className="space-y-2">
                {course.contents.map((block, index) => (
                  <button
                    type="button"
                    key={block.id}
                    onClick={() => {
                      setActiveBlock(index);
                      setQuizScore(null);
                    }}
                    className={`focus-ring flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${activeBlock === index ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted'}`}
                    data-testid={`button-content-${block.id}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activeBlock === index ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                    >
                      <BlockIcon type={block.type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm">
                        {index + 1}. {block.title}
                      </strong>
                      <span
                        className={`mt-1 block text-xs ${activeBlock === index ? 'text-background/65' : 'text-muted-foreground'}`}
                      >
                        {block.type} · {block.duration} min
                      </span>
                    </span>
                    {activeBlock === index && <Play className="h-4 w-4 fill-current" />}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <aside className="lg:pt-14">
            <div className="studio-paper sticky top-24 rounded-[1.5rem] border border-border p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <BlockIcon type={active.type} />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
                    Now playing
                  </p>
                  <h2 className="mt-1 font-serif text-2xl leading-none">{active.title}</h2>
                </div>
              </div>

              {/* Dynamic Interactive Media Player */}
              {active.type === 'video' && active.source ? (
                <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={active.source}
                    title={active.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : active.type === 'presentation' && active.source ? (
                <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={active.source}
                    title={active.title}
                    className="h-full w-full border-0"
                    allowFullScreen
                  />
                </div>
              ) : active.type === 'quiz' ? (
                <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">
                    Interactive Quiz Check
                  </p>
                  {active.questions.map((q, qIdx) => (
                    <div key={qIdx} className="mt-4 border-t border-border pt-4">
                      <p className="text-sm font-semibold">{qIdx + 1}. {q.prompt}</p>
                      <div className="mt-3 grid gap-2">
                        {q.options.map((opt, optIdx) => (
                          <button
                            type="button"
                            key={optIdx}
                            onClick={() =>
                              setSelectedQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                            }
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${selectedQuizAnswers[qIdx] === optIdx ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background hover:bg-muted'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={handleVerifyQuiz}
                      className="rounded-full bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
                    >
                      Check answers
                    </button>
                    {quizScore && (
                      <span className="text-xs font-bold">
                        Score: {quizScore.score}/{quizScore.total}{' '}
                        {quizScore.passed ? '🎉 (Passed!)' : '— Try again'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-foreground text-background">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </div>
                    <p className="mt-4 text-sm font-semibold">
                      Play this lesson
                    </p>
                    <p className="mt-1 text-xs text-background/60">{active.duration} minutes</p>
                  </div>
                </div>
              )}

              <p className="mt-5 text-sm leading-6 text-muted-foreground">{active.description}</p>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                onClick={markComplete}
                disabled={completed || completeMutation.isPending}
                className={`focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 ${completed ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'}`}
                data-testid="button-complete-course"
              >
                {completed ? (
                  <>
                    <Check className="h-4 w-4" />
                    Course completed
                  </>
                ) : completeMutation.isPending ? (
                  'Saving your progress…'
                ) : (
                  'Mark course complete'
                )}
              </button>

              {completed && !rated && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-bold">How did it land?</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Ratings open after you finish the course.
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setRating(value)}
                        className="focus-ring rounded p-1"
                        data-testid={`button-rate-${value}`}
                      >
                        <Star
                          className={`h-6 w-6 ${rating >= value ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={submitRating}
                    disabled={!rating || rateMutation.isPending}
                    className="focus-ring mt-3 w-full rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background disabled:opacity-40"
                    data-testid="button-submit-rating"
                  >
                    {rateMutation.isPending ? 'Saving…' : 'Share rating'}
                  </button>
                </div>
              )}

              {rated && (
                <p
                  className="mt-5 border-t border-border pt-5 text-sm font-semibold text-[hsl(var(--accent-foreground))]"
                  data-testid="status-rating-saved"
                >
                  Thanks for the thoughtful rating.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[.16em]">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-8 font-serif text-5xl tracking-[-.07em]">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function TeacherPage() {
  const summaryQuery = useGetTeacherSummary({
    query: { queryKey: getGetTeacherSummaryQueryKey() },
  });
  const summary = summaryQuery.data;
  const recent = summary?.recentCourses ?? demoCourses.slice(0, 3);
  return (
    <div className="min-h-[100dvh]">
      <AppHeader teacher />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent-foreground))]">
              Teacher studio
            </p>
            <h1 className="mt-3 font-serif text-6xl tracking-[-.07em]">Make knowledge move.</h1>
            <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
              A quiet dashboard for the work behind a useful course.
            </p>
          </div>
          <Link
            href="/teacher/new"
            className="focus-ring inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-1 md:self-auto"
            data-testid="link-create-course"
          >
            <Plus className="h-4 w-4" />
            Create a course
          </Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryQuery.isLoading ? (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))
          ) : (
            <>
              <Metric
                label="Published"
                value={String(summary?.publishedCount ?? 12)}
                note="courses in the studio"
                icon={Layers3}
              />
              <Metric
                label="Learners"
                value={String(summary?.totalLearners ?? '2,430')}
                note="people reached so far"
                icon={Users}
              />
              <Metric
                label="Avg. rating"
                value={(summary?.averageRating ?? 4.8).toFixed(1)}
                note="from completed courses"
                icon={Star}
              />
              <Metric
                label="Completion"
                value={`${summary?.completionRate ?? 76}%`}
                note="learners seeing it through"
                icon={BarChart3}
              />
            </>
          )}
        </div>
        <div className="mt-14 flex items-end justify-between border-b border-border pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
              Your recent courses
            </p>
            <h2 className="mt-2 font-serif text-3xl">Keep the shelf fresh.</h2>
          </div>
          <Link
            href="/teacher/new"
            className="hidden items-center gap-2 text-sm font-bold md:flex"
            data-testid="link-add-course-inline"
          >
            Add another <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {recent.map((course) => (
            <Link
              href={`/learner/course/${course.id}`}
              className="group focus-ring flex gap-4 rounded-2xl border border-border bg-card p-3 transition-transform hover:-translate-y-1"
              key={course.id}
              data-testid={`card-teacher-course-${course.id}`}
            >
              <div
                className="course-swatch h-28 w-28 shrink-0 rounded-xl"
                style={{ '--swatch': course.accent } as React.CSSProperties}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">
                    {course.category}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-xl leading-tight">
                    {course.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <StarRating rating={course.rating} compact />
                  <span className="text-muted-foreground">
                    {course.students.toLocaleString()} learners
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {summaryQuery.isError && (
          <p className="mt-5 text-xs text-muted-foreground" data-testid="status-teacher-demo">
            Showing studio sample metrics while your teacher summary reconnects.
          </p>
        )}
      </main>
    </div>
  );
}

function TeacherNewPage() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateCourse();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Design');
  const [level, setLevel] = useState<CourseInputLevel>('beginner');
  const [instructor, setInstructor] = useState('Studio Instructor');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    {
      id: `block-${Date.now()}`,
      type: ContentBlockType.video,
      title: 'Welcome to the course',
      description: 'What will learners be able to do when they finish?',
      duration: 10,
      source: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
      questions: [],
    },
  ]);

  const addBlock = (type: ContentBlockType) =>
    setBlocks((current) => [
      ...current,
      {
        id: `block-${Date.now()}-${current.length}`,
        type,
        title:
          type === ContentBlockType.video
            ? 'New video lesson'
            : type === ContentBlockType.presentation
              ? 'New presentation'
              : 'New quiz',
        description: '',
        duration: 10,
        source: type === ContentBlockType.video ? 'https://www.youtube.com/embed/aqz-KE-bpKQ' : null,
        questions:
          type === ContentBlockType.quiz
            ? [
                {
                  prompt: 'What key concept should learners remember?',
                  options: ['A core useful method', 'An unnecessary distraction', 'A misconception'],
                  answer: 0,
                },
              ]
            : [],
      },
    ]);

  const updateBlock = (id: string, patch: Partial<ContentBlock>) =>
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...patch } : block))
    );

  const submit = () => {
    if (!title.trim() || !description.trim() || !instructor.trim()) return;
    setPublishError(null);
    const data: CourseInput = { title, description, category, level, instructor, contents: blocks };
    createMutation.mutate(
      { data },
      {
        onSuccess: (course) => {
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ sort: 'rating' }) });
          queryClient.invalidateQueries({ queryKey: getGetTeacherSummaryQueryKey() });
          setLocation(`/learner/course/${course.id}`);
        },
        onError: (err: any) => {
          setPublishError(err?.data?.error || err?.message || 'Failed to publish course. Please try again.');
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh]">
      <AppHeader teacher />
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-10 lg:py-14">
        <Link
          href="/teacher"
          className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          data-testid="link-back-teacher"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to studio
        </Link>
        <div className="mt-9 max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent-foreground))]">
            New course
          </p>
          <h1 className="mt-3 font-serif text-6xl leading-[.93] tracking-[-.07em]">
            Give your know-how a shape.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Start simple. You can refine the details once the useful part is on the page.
          </p>
        </div>

        {publishError && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {publishError}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-5">
            <div className="studio-paper rounded-2xl border border-border p-6">
              <div className="grid gap-5">
                <label className="grid gap-2 text-sm font-semibold">
                  Course title
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="The skill people ask you about"
                    className="focus-ring rounded-xl border border-input bg-background px-4 py-3 font-serif text-2xl outline-none placeholder:text-muted-foreground/60"
                    data-testid="input-course-title"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Description
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What will someone be able to do after this?"
                    rows={4}
                    className="focus-ring resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground/60"
                    data-testid="input-course-description"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                    <input
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="focus-ring rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground outline-none"
                      data-testid="input-course-category"
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Level
                    <select
                      value={level}
                      onChange={(event) => setLevel(event.target.value as CourseInputLevel)}
                      className="focus-ring rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground outline-none"
                      data-testid="select-course-level"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Teacher
                    <input
                      value={instructor}
                      onChange={(event) => setInstructor(event.target.value)}
                      className="focus-ring rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground outline-none"
                      data-testid="input-course-instructor"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                    Content blocks
                  </p>
                  <h2 className="mt-1 font-serif text-3xl">Build the path.</h2>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {blocks.length} blocks
                </span>
              </div>
              {blocks.map((block, index) => (
                <div className="rounded-2xl border border-border bg-card p-5" key={block.id}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                      <BlockIcon type={block.type} />
                    </span>
                    <div className="flex-1">
                      <p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">
                        Block {String(index + 1).padStart(2, '0')} · {block.type}
                      </p>
                      <input
                        value={block.title}
                        onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                        className="focus-ring mt-1 w-full bg-transparent font-serif text-xl outline-none"
                        data-testid={`input-block-title-${block.id}`}
                      />
                    </div>
                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setBlocks((current) => current.filter((item) => item.id !== block.id))
                        }
                        className="focus-ring rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        data-testid={`button-remove-block-${block.id}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_100px]">
                    <textarea
                      value={block.description}
                      onChange={(event) =>
                        updateBlock(block.id, { description: event.target.value })
                      }
                      rows={2}
                      placeholder="What happens in this block?"
                      className="focus-ring resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                      data-testid={`input-block-description-${block.id}`}
                    />
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Minutes
                      <input
                        type="number"
                        min="1"
                        value={block.duration}
                        onChange={(event) =>
                          updateBlock(block.id, { duration: Number(event.target.value) })
                        }
                        className="focus-ring rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal tracking-normal text-foreground outline-none"
                        data-testid={`input-block-duration-${block.id}`}
                      />
                    </label>
                  </div>

                  {/* Media Link input for video and presentation blocks */}
                  {(block.type === ContentBlockType.video ||
                    block.type === ContentBlockType.presentation) && (
                    <div className="mt-3">
                      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Embed Link (YouTube / Slides / Media URL)
                        <input
                          value={block.source || ''}
                          onChange={(event) =>
                            updateBlock(block.id, { source: event.target.value })
                          }
                          placeholder="https://www.youtube.com/embed/..."
                          className="focus-ring rounded-xl border border-input bg-background px-3 py-2 text-xs font-normal normal-case tracking-normal text-foreground outline-none"
                          data-testid={`input-block-source-${block.id}`}
                        />
                      </label>
                    </div>
                  )}

                  {block.type === ContentBlockType.quiz && (
                    <div className="mt-4 rounded-xl bg-muted p-4">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                        Quiz prompt
                      </p>
                      <input
                        value={block.questions[0]?.prompt || ''}
                        onChange={(event) =>
                          updateBlock(block.id, {
                            questions: [
                              {
                                ...(block.questions[0] || { options: ['Option 1', 'Option 2'], answer: 0 }),
                                prompt: event.target.value,
                              },
                            ],
                          })
                        }
                        className="focus-ring mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
                        data-testid={`input-quiz-prompt-${block.id}`}
                      />
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold text-muted-foreground">Answer choices:</p>
                        {(block.questions[0]?.options || ['Option 1', 'Option 2', 'Option 3']).map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`quiz-answer-${block.id}`}
                              checked={block.questions[0]?.answer === optIndex}
                              onChange={() =>
                                updateBlock(block.id, {
                                  questions: [
                                    {
                                      ...(block.questions[0] || { prompt: '', options: [] }),
                                      answer: optIndex,
                                    },
                                  ],
                                })
                              }
                            />
                            <input
                              value={opt}
                              onChange={(event) => {
                                const newOpts = [...(block.questions[0]?.options || [])];
                                newOpts[optIndex] = event.target.value;
                                updateBlock(block.id, {
                                  questions: [
                                    {
                                      ...(block.questions[0] || { prompt: '', answer: 0 }),
                                      options: newOpts,
                                    },
                                  ],
                                });
                              }}
                              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none flex-1"
                            />
                            {block.questions[0]?.answer === optIndex && (
                              <span className="text-[10px] font-bold text-primary uppercase">Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <aside className="lg:pt-8">
            <div className="studio-paper sticky top-24 rounded-2xl border border-border p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                Add a block
              </p>
              <div className="mt-3 grid gap-2">
                {([
                  [ContentBlockType.video, 'Video', Film],
                  [ContentBlockType.presentation, 'Presentation', Presentation],
                  [ContentBlockType.quiz, 'Quiz', FileQuestion],
                ] as const).map(([type, label, Icon]) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => addBlock(type as ContentBlockType)}
                    className="focus-ring flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-muted"
                    data-testid={`button-add-${type}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                    <Plus className="ml-auto h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <div className="mt-7 border-t border-border pt-5">
                <p className="text-xs leading-5 text-muted-foreground">
                  You can publish a useful first draft now and improve it as learners ask better
                  questions.
                </p>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!title.trim() || !description.trim() || createMutation.isPending}
                  className="focus-ring mt-5 w-full rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
                  data-testid="button-publish-course"
                >
                  {createMutation.isPending ? 'Publishing…' : 'Publish course'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function AuthShell({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [showPhoneHint, setShowPhoneHint] = useState(false);
  return <main className="studio-grain grid min-h-[100dvh] bg-foreground lg:grid-cols-[.9fr_1.1fr]"><section className="relative hidden overflow-hidden p-10 text-background lg:flex lg:flex-col lg:justify-between"><Logo inverse /><div className="relative z-10 max-w-lg pb-10"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">A focused place to begin</p><h1 className="mt-5 font-serif text-7xl leading-[.9] tracking-[-.07em]">{mode === 'sign-in' ? 'Good to see you again.' : 'Bring your curiosity.'}</h1><p className="mt-6 max-w-md text-base leading-7 text-background/65">{mode === 'sign-in' ? 'Your shelf is waiting — pick up exactly where you left off.' : 'Make room for useful knowledge, taught by people who have put it to work.'}</p></div><div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full border-[36px] border-primary/80" /><div className="absolute bottom-24 right-20 h-24 w-24 rotate-12 bg-[hsl(var(--accent))]" /></section><section className="flex flex-col items-center justify-center bg-background px-5 py-8"><div className="mb-8 flex w-full max-w-[440px] items-center justify-between lg:hidden"><Logo /><Link href="/" className="text-sm font-semibold text-muted-foreground" data-testid="link-auth-home">Home</Link></div>{hasClerk ? mode === 'sign-in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /> : <div className="w-full max-w-[440px] rounded-[2rem] border border-border bg-card p-7 shadow-xl"><Logo /><h1 className="mt-10 font-serif text-4xl tracking-[-.05em]">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Clerk is ready to connect in your deployed environment. In the meantime, take a look around the learning studio.</p><Link href="/portal" className="focus-ring mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground" data-testid="link-auth-demo-portal">Continue to preview <ArrowRight className="h-4 w-4" /></Link><div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">{mode === 'sign-in' ? <>New here? <Link href="/sign-up" className="font-bold text-foreground" data-testid="link-auth-switch-sign-up">Create an account</Link></> : <>Already a member? <Link href="/sign-in" className="font-bold text-foreground" data-testid="link-auth-switch-sign-in">Sign in</Link></>}</div></div>}{mode === 'sign-up' && <div className="mt-5 flex w-full max-w-[440px] items-start gap-3 rounded-xl bg-secondary/50 p-4 text-xs leading-5 text-muted-foreground"><button type="button" onClick={() => setShowPhoneHint((current) => !current)} className="focus-ring mt-0.5 shrink-0 rounded-full bg-foreground px-2 py-0.5 font-mono text-[9px] font-bold text-background" data-testid="button-phone-info">i</button><span>{showPhoneHint ? 'Phone numbers are collected after sign-up during onboarding. SkillShare does not use phone SMS for sign-in.' : 'You can add a phone number after creating your account during onboarding.'}</span></div>}</section></main>;
}

 function AppRouter() {
  return <><ThemeToggle /><Switch><Route path="/" component={LandingPage} /><Route path="/sign-in/*?" component={() => <AuthShell mode="sign-in" />} /><Route path="/sign-up/*?" component={() => <AuthShell mode="sign-up" />} /><Route path="/portal" component={PortalPage} /><Route path="/learner" component={LearnerPage} /><Route path="/learner/course/:courseId" component={CourseDetailPage} /><Route path="/teacher" component={TeacherPage} /><Route path="/teacher/new" component={TeacherNewPage} /><Route component={NotFound} /></Switch></>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const currentQueryClient = useQueryClient();
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      if (!user) currentQueryClient.clear();
    });
    return unsubscribe;
  }, [addListener, currentQueryClient]);
  return null;
}

function App() {
  const appearance = { theme: shadcn, cssLayerName: 'clerk', options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: '#14B8C4', colorForeground: '#0B3141', colorMutedForeground: '#5E7580', colorBackground: '#F4FCFD', colorInput: '#FFFFFF', colorInputForeground: '#0B3141', colorDanger: '#C05A71', colorNeutral: '#C6DDE1', fontFamily: 'DM Sans', borderRadius: '1rem' }, elements: { rootBox: 'w-full flex justify-center', cardBox: 'bg-[#F4FCFD] rounded-[2rem] w-[440px] max-w-full overflow-hidden shadow-xl', card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none', headerTitle: '!text-[#0B3141] !font-serif', headerSubtitle: '!text-[#5E7580]', socialButtonsBlockButtonText: '!text-[#0B3141]', formFieldLabel: '!text-[#0B3141]', footerActionLink: '!text-[#0B3141] !font-bold', footerActionText: '!text-[#5E7580]', dividerText: '!text-[#5E7580]', identityPreviewEditButton: '!text-[#0B3141]', formFieldSuccessText: '!text-[#2B8C8D]', alertText: '!text-[#0B3141]', logoBox: 'mb-2', logoImage: 'h-9', socialButtonsBlockButton: '!border-[#C6DDE1] !bg-[#FFFFFF]', formButtonPrimary: '!bg-[#14B8C4] !text-[#0B3141] hover:!bg-[#1098A4]', formFieldInput: '!border-[#C6DDE1] !bg-[#FFFFFF] !text-[#0B3141]', footerAction: '!bg-transparent', dividerLine: '!bg-[#C6DDE1]', alert: '!bg-[#E5F3F5]', otpCodeFieldInput: '!border-[#C6DDE1]', formFieldRow: 'mb-4', main: 'px-2' } };
  const router = <WouterRouter base={basePath}><AppRouter /></WouterRouter>;
  return <QueryClientProvider client={queryClient}>{hasClerk ? <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Pick up where you left off' } }, signUp: { start: { title: 'Create your account', subtitle: 'Make room for useful knowledge' } } }}>{router}<ClerkQueryClientCacheInvalidator /></ClerkProvider> : router}</QueryClientProvider>;
}

export default App;
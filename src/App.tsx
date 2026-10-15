import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Cpu,
  Download,
  Fan,
  HardDrive,
  Info,
  Layers3,
  Menu,
  Monitor,
  Mouse,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  builderCategories,
  hardwareCategories,
  hardwareParts,
  type HardwareCategory,
  type HardwarePart,
  type PartCategory,
} from '@/data/hardwareCatalog';
import { checkCompatibility } from '@/data/compatibility';
import { HardwareIllustration } from '@/components/HardwareIllustration';
import { CheckoutFlow, MyOrders, PartRequestFlow, Storefront } from '@/components/store';
import {
  clearOrders,
  readCart,
  readOrders,
  readRequests,
  saveCart,
  type DemoCartLine,
  type DemoOrder,
  type SavedRequest,
} from '@/lib/demoStore';
import '@/index.css';

type BuildSelection = Partial<Record<PartCategory, HardwarePart>>;
type CheckoutSelection = {
  lines: DemoCartLine[];
  buildOrder: boolean;
  compatibilityNotes: string[];
};
type QuizQuestion = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

const categoryIcons: Record<string, LucideIcon> = {
  cpu: Cpu,
  gpu: Layers3,
  motherboard: Layers3,
  ram: Layers3,
  storage: HardDrive,
  psu: Zap,
  case: Monitor,
  cooler: Fan,
  fans: Fan,
  monitor: Monitor,
  keyboard: Layers3,
  mouse: Mouse,
};

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Which component keeps files when the computer is switched off?',
    choices: ['RAM', 'Storage drive', 'CPU cache', 'Graphics memory'],
    answer: 1,
    explanation: 'An SSD or HDD is persistent storage. RAM is temporary working space.',
  },
  {
    question: 'What is the first physical compatibility detail to compare for a CPU and motherboard?',
    choices: ['Case colour', 'CPU socket', 'Monitor refresh rate', 'Keyboard layout'],
    answer: 1,
    explanation: 'The socket must match, then check chipset support and the board BIOS version.',
  },
  {
    question: 'What does VRAM primarily provide?',
    choices: ['Memory local to the graphics card', 'Extra motherboard storage', 'Power for the CPU', 'A faster internet connection'],
    answer: 0,
    explanation: 'VRAM is graphics-card memory used for visual data such as textures and frame buffers.',
  },
  {
    question: 'Can DDR4 memory be installed in a DDR5 motherboard slot?',
    choices: ['Yes, all desktop RAM is interchangeable', 'No, the generations use different slots', 'Only if the PSU is larger', 'Only with a BIOS update'],
    answer: 1,
    explanation: 'DDR generations have different electrical and physical designs. Match memory generation to the board.',
  },
  {
    question: 'What should you check before choosing a graphics card?',
    choices: ['Case clearance and PSU connectors', 'Only the card colour', 'The keyboard polling rate', 'Whether RAM has an SSD'],
    answer: 0,
    explanation: 'Exact GPU dimensions, case clearance, PSU capacity and connectors all matter.',
  },
  {
    question: 'What is one reason to choose an SSD as a system drive?',
    choices: ['It usually loads applications faster than an HDD', 'It replaces the motherboard', 'It adds more CPU cores', 'It needs no interface check'],
    answer: 0,
    explanation: 'SSDs generally offer much quicker access and loading than mechanical hard drives.',
  },
  {
    question: 'Does a PSU wattage label alone prove it is suitable?',
    choices: ['Yes, wattage is the only requirement', 'No, also check connectors, dimensions and model quality', 'Yes, if the case is ATX', 'No, PSUs cannot power graphics cards'],
    answer: 1,
    explanation: 'Capacity is only one check. Exact connectors, physical fit, quality and protections matter too.',
  },
];

const learningTopics = [
  {
    title: 'How a computer works',
    body: 'A program sends instructions to the CPU. The CPU works with temporary RAM, asks storage for saved files, and sends visual work to the GPU. The motherboard connects these parts while the PSU supplies regulated power.',
  },
  {
    title: 'How the core components work together',
    body: 'The CPU coordinates general work; the GPU accelerates graphics; RAM holds active tasks; storage keeps data; the motherboard connects devices; and the PSU delivers the power each part needs.',
  },
  {
    title: 'Choose parts for the work you do',
    body: 'For gaming, balance the GPU with your display resolution and refresh rate. For code, browsing, or office work, a capable CPU, enough memory, and a responsive SSD can matter more than a high-end graphics card. Creative tools have their own CPU, GPU, memory, and storage needs.',
  },
  {
    title: 'Common PC-building mistakes',
    body: 'Frequent oversights include mismatched CPU sockets or DDR generations, forgetting a CPU cooler, underestimating GPU length, missing power connectors, leaving protective films in place, and connecting a monitor to the motherboard instead of a discrete graphics card.',
  },
  {
    title: 'Compatibility rules worth checking',
    body: 'Match CPU socket and confirm chipset/BIOS support; match RAM generation and supported capacity; check motherboard size against the case; verify GPU and cooler clearance; then compare estimated power, connectors, storage interfaces, and physical dimensions.',
  },
  {
    title: 'Gaming PC versus productivity PC',
    body: 'A gaming build often allocates more of its budget to graphics performance and a high-refresh display. Productivity needs depend on the application: compiling, 3D rendering, video editing, and spreadsheets can favour different CPU, GPU, RAM, and storage balances.',
  },
  {
    title: 'SSD versus HDD',
    body: 'An SSD has no spinning parts and usually gives faster booting, loading, and file access. An HDD is mechanical and can offer economical high-capacity storage. An SSD for the operating system plus optional archive storage is a common approach.',
  },
  {
    title: 'RAM capacity versus RAM speed',
    body: 'Capacity is how much working data fits; speed describes how quickly data transfers. Too little capacity can cause slowdowns, while speed gains depend on the CPU, motherboard, workload, and configured memory profile.',
  },
  {
    title: 'CPU performance versus GPU performance',
    body: 'The CPU handles general instructions, game logic, and many application tasks. The GPU handles highly parallel visual calculations. Which matters more depends on the software, resolution, settings, and the rest of the system.',
  },
  {
    title: 'Why a good-quality PSU matters',
    body: 'A power supply is responsible for stable output and safety protections. Do not choose by wattage or efficiency badge alone: check independent testing, protections, exact revision, connector needs, dimensions, and a sensible amount of headroom.',
  },
];

const inr = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

function readSavedBuild(): { selection: BuildSelection; budget: string } {
  try {
    const raw = localStorage.getItem('nexus-pc-lab-build');
    if (!raw) {
      return { selection: {}, budget: '' };
    }
    const saved = JSON.parse(raw) as { ids?: Partial<Record<PartCategory, string>>; budget?: string };
    const selection: BuildSelection = {};
    builderCategories.forEach(({ id }) => {
      const found = hardwareParts.find((part) => part.id === saved.ids?.[id]);
      if (found) {
        selection[id] = found;
      }
    });
    return { selection, budget: typeof saved.budget === 'string' ? saved.budget : '' };
  } catch {
    return { selection: {}, budget: '' };
  }
}

function App() {
  const [introVisible, setIntroVisible] = useState(() => {
    try {
      return sessionStorage.getItem('nexus-intro-complete') !== 'yes';
    } catch {
      return true;
    }
  });
  const [introLeaving, setIntroLeaving] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedDetail, setSelectedDetail] = useState<HardwareCategory | null>(null);
  const [selection, setSelection] = useState<BuildSelection>(() => readSavedBuild().selection);
  const [budget, setBudget] = useState(() => readSavedBuild().budget);
  const [cartLines, setCartLines] = useState<DemoCartLine[]>(() => readCart());
  const [orders, setOrders] = useState<DemoOrder[]>(() => readOrders());
  const [requests, setRequests] = useState<SavedRequest[]>(() => readRequests());
  const [checkoutSelection, setCheckoutSelection] = useState<CheckoutSelection | null>(null);
  const [activeCategory, setActiveCategory] = useState<PartCategory | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const introButtonRef = useRef<HTMLButtonElement>(null);

  const total = useMemo(
    () => Object.values(selection).reduce((sum, part) => sum + (part?.price ?? 0), 0),
    [selection],
  );
  const compatibility = useMemo(() => checkCompatibility(selection), [selection]);
  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return hardwareCategories.filter((category) => {
      const matchesCategory = categoryFilter === 'all' || category.id === categoryFilter;
      const products = hardwareParts
        .filter((part) => part.category === category.id)
        .map((part) => `${part.name} ${part.specs}`)
        .join(' ');
      const terms = category.terms
        .map((term) => `${term.term} ${term.meaning}`)
        .join(' ');
      const examples = category.examples.join(' ');
      const searchable =
        `${category.name} ${category.short} ${category.description} ${products} ${terms} ${examples}`.toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [categoryFilter, searchTerm]);
  const partsInPicker = activeCategory
    ? hardwareParts.filter((part) => part.category === activeCategory)
    : [];
  const budgetNumber = Number(budget);

  useEffect(() => {
    try {
      const ids: Partial<Record<PartCategory, string>> = {};
      builderCategories.forEach(({ id }) => {
        if (selection[id]) {
          ids[id] = selection[id]?.id;
        }
      });
      localStorage.setItem('nexus-pc-lab-build', JSON.stringify({ ids, budget }));
    } catch {
      // The build still works in memory if browser storage is unavailable.
    }
  }, [selection, budget]);

  useEffect(() => {
    try {
      saveCart(cartLines);
    } catch {
      // Cart controls remain available in memory when browser storage is blocked.
    }
  }, [cartLines]);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 460);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedDetail(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (introVisible) {
      introButtonRef.current?.focus();
    } else {
      mainRef.current?.focus();
    }
  }, [introVisible]);

  function goTo(section: string) {
    setActiveSection(section);
    setMobileMenuOpen(false);
    setActiveCategory(null);
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finishIntro() {
    if (introLeaving) {
      return;
    }
    setIntroLeaving(true);
    try {
      sessionStorage.setItem('nexus-intro-complete', 'yes');
    } catch {
      // Intro completion only persists for this component lifetime if blocked.
    }
    const transitionDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 620;
    window.setTimeout(() => {
      setIntroVisible(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, transitionDelay);
  }

  function selectPart(part: HardwarePart) {
    setSelection((current) => ({ ...current, [part.category]: part }));
    setActiveCategory(null);
  }

  function removePart(category: PartCategory) {
    setSelection((current) => {
      const next = { ...current };
      delete next[category];
      return next;
    });
  }

  function updateCartLine(productId: string, quantity: number) {
    setCartLines((current) => {
      if (quantity <= 0) return current.filter((line) => line.productId !== productId);
      return current.map((line) => line.productId === productId ? { ...line, quantity } : line);
    });
  }

  function checkoutCart() {
    setCheckoutSelection({ lines: cartLines, buildOrder: false, compatibilityNotes: [] });
    goTo('checkout');
  }

  function orderBuild() {
    const lines = builderCategories.flatMap(({ id }) => {
      const part = selection[id];
      return part ? [{ productId: part.id, quantity: 1 }] : [];
    });
    if (!lines.length) {
      goTo('builder');
      return;
    }
    const notes = [
      `Compatibility status: ${compatibility.label}`,
      ...(compatibility.missing.length ? [`Still to choose: ${compatibility.missing.join(', ')}.`] : []),
      ...compatibility.reasons,
    ];
    setCheckoutSelection({ lines, buildOrder: true, compatibilityNotes: notes });
    goTo('checkout');
  }

  function returnFromCheckout() {
    const section = checkoutSelection?.buildOrder ? 'builder' : 'shop';
    setCheckoutSelection(null);
    goTo(section);
  }

  function handleOrderCreated(order: DemoOrder) {
    setOrders(readOrders());
    if (!order.buildOrder) setCartLines([]);
  }

  function handleRequestsChange(next: SavedRequest[]) {
    setRequests(next);
  }

  function resetBuild() {
    if (Object.keys(selection).length > 0 && !window.confirm('Reset all selected components and keep your budget?')) {
      return;
    }
    setSelection({});
    setActiveCategory(null);
  }

  function exportBuild() {
    const selectedLines = builderCategories.map(({ id, label }) => {
      const part = selection[id];
      return `${label}: ${part ? `${part.name} — ${part.specs} — ${inr(part.price)}` : 'Not selected'}`;
    });
    const summary = [
      'NEXUS PC LAB — BUILD SUMMARY',
      'Educational estimate only. Not a live retailer quote or availability check.',
      '',
      ...selectedLines,
      '',
      `Estimated selected-parts total: ${inr(total)}`,
      `Target budget: ${budgetNumber > 0 ? inr(budgetNumber) : 'Not set'}`,
      `Compatibility status: ${compatibility.label}`,
      `Missing categories: ${compatibility.missing.length ? compatibility.missing.join(', ') : 'None'}`,
      '',
      'Compatibility notes:',
      ...compatibility.reasons.map((reason) => `- ${reason}`),
      '',
      'Catalogue prices and specifications are indicative and must be checked against exact product revisions.',
    ].join('\n');
    const file = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexus-pc-lab-build-summary.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  function answerQuiz(choice: number) {
    if (quizAnswer !== null) {
      return;
    }
    setQuizAnswer(choice);
    if (choice === quizQuestions[quizIndex].answer) {
      setQuizScore((score) => score + 1);
    }
  }

  function nextQuizQuestion() {
    if (quizIndex >= quizQuestions.length - 1) {
      setQuizFinished(true);
      return;
    }
    setQuizIndex((index) => index + 1);
    setQuizAnswer(null);
  }

  function restartQuiz() {
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  }

  return (
    <div className="app-shell">
      {introVisible && (
        <section
          className={`welcome${introLeaving ? ' leaving' : ''}`}
          aria-label="Welcome to NEXUS PC LAB"
          aria-hidden={introLeaving}
          inert={introLeaving}
        >
          <div className="container welcome-grid">
            <div>
              <div className="brand welcome-brand">
                <span className="brand-mark"><Cpu size={17} /></span>
                <span>
                  NEXUS PC LAB
                  <small>PC BUILDER &amp; HARDWARE LEARNING LAB</small>
                </span>
              </div>
              <div className="eyebrow">A practical place to begin</div>
              <h1 className="welcome-title">WELCOME TO PC BUILDER</h1>
              <p className="welcome-copy">Explore the technology. Understand the components. Build your dream PC.</p>
              <p className="welcome-credit">A Project By Parin &amp; Uday</p>
              <div className="hero-actions">
                <button ref={introButtonRef} className="button" onClick={finishIntro} data-testid="button-get-started">
                  GET STARTED <ArrowRight size={15} />
                </button>
              </div>
            </div>
            <div className="welcome-visual" aria-hidden="true">
              <PcTower />
            </div>
          </div>
        </section>
      )}

      <header className="topbar" inert={introVisible}>
        <div className="nav-wrap">
          <button className="brand" onClick={() => goTo('home')} aria-label="NEXUS PC LAB home" data-testid="link-brand-home">
            <span className="brand-mark"><Cpu size={17} /></span>
            <span>
              NEXUS PC LAB
              <small>HARDWARE LEARNING LAB</small>
            </span>
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <nav className={`nav-links${mobileMenuOpen ? ' open' : ''}`} aria-label="Main navigation">
            {[
              ['home', 'Home'],
              ['explorer', 'Hardware'],
              ['builder', 'Builder'],
              ['shop', 'Shop'],
              ['learn', 'Learn'],
              ['about', 'About'],
              ['orders', 'My Orders'],
              ['requests', 'My Requests'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`nav-link${activeSection === id ? ' active' : ''}`}
                onClick={() => goTo(id)}
                data-testid={`nav-${id}`}
              >
                {label}
              </button>
            ))}
            <button className={`nav-link${activeSection === 'cart' ? ' active' : ''}`} onClick={() => goTo('cart')} data-testid="nav-cart">
              Cart ({cartLines.reduce((sum, line) => sum + line.quantity, 0)})
            </button>
            <button className="button nav-cta" onClick={() => goTo('builder')} data-testid="button-nav-start-build">
              START BUILDING <ArrowRight size={14} />
            </button>
          </nav>
        </div>
      </header>

      <main ref={mainRef} id="main-content" tabIndex={-1} aria-label="NEXUS PC LAB application" inert={introVisible}>
        <section id="home">
          <div className="container hero">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">Your first step into PC hardware</div>
                <h1>Understand the Hardware. <span>Build Your Perfect PC.</span></h1>
                <p>Explore PC components, learn how they work, and assemble your own compatible computer with an interactive building experience.</p>
                <div className="hero-actions">
                  <button className="button" onClick={() => goTo('builder')} data-testid="button-start-building">
                    START BUILDING <ArrowRight size={15} />
                  </button>
                  <button className="button secondary" onClick={() => goTo('explorer')} data-testid="button-explore-hardware">
                    EXPLORE HARDWARE
                  </button>
                </div>
              </div>
              <div className="hero-art" aria-label="Stylised desktop PC illustration">
                <PcTower />
                <div className="art-label">SYSTEM / BUILD STUDY&nbsp;&nbsp; 01</div>
              </div>
            </div>
          </div>
          <div className="container feature-strip" aria-label="Platform capabilities">
            <div className="strip-item"><Layers3 className="strip-icon" size={17} />Explore Components</div>
            <div className="strip-item"><ShieldCheck className="strip-icon" size={17} />Check Compatibility</div>
            <div className="strip-item"><Zap className="strip-icon" size={17} />Estimate Build Cost</div>
          </div>

          <section className="container section" aria-labelledby="explore-feature-title">
            <div className="split-feature">
              <div className="feature-visual" aria-hidden="true">
                <div className="feature-visual-mark"><Cpu size={58} strokeWidth={1.15} /></div>
              </div>
              <div className="feature-copy">
                <div className="eyebrow">01 / Learn the parts</div>
                <h3 id="explore-feature-title">Know Every Component.</h3>
                <p>Discover what each PC component does, understand its specifications, and compare hardware options before making a decision.</p>
                <button className="button secondary" onClick={() => goTo('explorer')} data-testid="button-explore-components">
                  EXPLORE COMPONENTS <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="split-feature reverse">
              <div className="feature-visual" aria-hidden="true">
                <div className="feature-visual-mark"><Layers3 size={58} strokeWidth={1.15} /></div>
              </div>
              <div className="feature-copy">
                <div className="eyebrow">02 / Put it together</div>
                <h3>Build It Your Way.</h3>
                <p>Select your components, estimate the total cost, and check important compatibility requirements before finalizing your build.</p>
                <button className="button secondary" onClick={() => goTo('builder')} data-testid="button-build-your-pc">
                  BUILD YOUR PC <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>

          <section className="container section" aria-labelledby="how-parts-work">
            <div className="workflow">
              <div>
                <div className="eyebrow">A system, not a pile of parts</div>
                <h2 className="section-title" id="how-parts-work">Every component has a role.</h2>
                <p className="section-intro">A PC works because specialised parts pass work between one another. Start with what you want the computer to do, then make the parts fit the job.</p>
              </div>
              <div className="workflow-steps">
                {[
                  ['01', 'The CPU coordinates', 'It runs instructions and works with active data in memory.'],
                  ['02', 'The GPU draws the picture', 'It handles graphics and other parallel workloads.'],
                  ['03', 'The platform connects it all', 'The motherboard routes data; storage keeps files; the PSU powers the system.'],
                ].map(([number, title, copy]) => (
                  <div className="workflow-step" key={number}>
                    <span className="step-number">{number}</span>
                    <div><strong>{title}</strong><span>{copy}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="container section" aria-labelledby="beginner-tips-title">
            <div className="eyebrow">Start with a few checks</div>
            <h2 className="section-title" id="beginner-tips-title">Good builds begin with good questions.</h2>
            <div className="tips-grid">
              {[
                ['01 / PURPOSE', 'What will you use it for? Gaming, study, creative work, and everyday tasks place different demands on parts.'],
                ['02 / PLATFORM', 'Choose a CPU and compatible motherboard platform before choosing memory and the rest of the build.'],
                ['03 / VERIFY FIT', 'Check exact board, GPU, cooler, PSU dimensions and connectors in manufacturer documentation before buying.'],
              ].map(([label, copy]) => (
                <article className="tip" key={label}><span>{label}</span><p>{copy}</p></article>
              ))}
            </div>
          </section>
        </section>

        <section id="explorer" className="container section">
          <div className="page-heading">
            <div className="eyebrow">Hardware Explorer / 12 guides</div>
            <h1>Get to know what’s inside.</h1>
            <p className="section-intro">A component-by-component guide, built for curious first-timers. Learn the language before you choose a part.</p>
          </div>
          <div className="explorer-tools">
            <label className="search-wrap">
              <Search size={17} />
              <span className="sr-only">Search components and example products</span>
              <input
                className="field"
                type="search"
                placeholder="Search components, terms or example products"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                data-testid="input-hardware-search"
              />
            </label>
            <label>
              <span className="sr-only">Filter hardware category</span>
              <select
                className="field filter-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                data-testid="select-hardware-category"
              >
                <option value="all">All categories</option>
                {hardwareCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <span className="counter-note" data-testid="text-hardware-results">{filteredCategories.length} topics</span>
          </div>
          {filteredCategories.length ? (
            <div className="hardware-grid">
              {filteredCategories.map((category) => {
                const Icon = categoryIcons[category.id];
                return (
                  <article className="hardware-card" key={category.id} data-testid={`card-hardware-${category.id}`}>
                    <div className="hardware-card-top">
                      <span className="hardware-icon"><Icon size={19} strokeWidth={1.6} /></span>
                      <span className="eyebrow">GUIDE / {String(hardwareCategories.indexOf(category) + 1).padStart(2, '0')}</span>
                    </div>
                    <HardwareIllustration category={category.id} className="hardware-card-image" />
                    <span className="hardware-model-count">
                      {hardwareParts.filter((part) => part.category === category.id).length || category.examples.length}
                      {' '}{hardwareParts.some((part) => part.category === category.id) ? 'BUILDER MODELS' : 'MODEL EXAMPLES'}
                    </span>
                    <h3>{category.name}</h3>
                    <p>{category.short}</p>
                    <button className="text-action" onClick={() => setSelectedDetail(category)} data-testid={`button-learn-more-${category.id}`}>
                      LEARN MORE <ArrowRight size={12} />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="picker-empty" role="status">No hardware guide matches “{searchTerm}”. Try another term or clear the category filter.</div>
          )}
        </section>

        <section id="builder" className="container section">
          <div className="page-heading">
            <div className="eyebrow">Build a PC / Interactive configurator</div>
            <h1>Put together a build that makes sense.</h1>
            <p className="section-intro">Choose parts one at a time. The estimate counts only what you select, and compatibility notes explain what’s known—and what still needs checking.</p>
          </div>

          <div className="builder-layout">
            <section className="panel panel-pad" aria-labelledby="component-selection-title">
              <div className="panel-title">
                <h2 id="component-selection-title">Your components</h2>
                <span className="counter-note">{compatibility.selectedCount} / {builderCategories.length}</span>
              </div>
              <div className="component-list">
                {builderCategories.map(({ id, label }) => {
                  const part = selection[id];
                  return (
                    <div className="component-slot" key={id}>
                      <div className="slot-head">
                        <strong>{label}</strong>
                        {part && <span className="mono" style={{ color: '#a1e2e9', fontSize: 10 }}>{inr(part.price)}</span>}
                      </div>
                      <div className="slot-product">{part?.name ?? 'Nothing selected yet'}</div>
                      <div className="slot-actions">
                        <button className="compact-button" onClick={() => setActiveCategory(id)} data-testid={`button-select-${id}`}>
                          {part ? 'REPLACE' : 'CHOOSE PART'}
                        </button>
                        {part && (
                          <button className="compact-button remove" onClick={() => removePart(id)} data-testid={`button-remove-${id}`}>
                            REMOVE
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel panel-pad" aria-labelledby="build-overview-title">
              <div className="panel-title">
                <h2 id="build-overview-title">{activeCategory ? `Choose ${builderCategories.find((item) => item.id === activeCategory)?.label}` : 'Build overview'}</h2>
                {activeCategory && (
                  <button className="icon-button" onClick={() => setActiveCategory(null)} aria-label="Close part choices" data-testid="button-close-part-picker">
                    <X size={16} />
                  </button>
                )}
              </div>
              {activeCategory ? (
                <div className="parts-picker">
                  {partsInPicker.map((part) => (
                    <article className="part-choice" key={part.id} data-testid={`card-part-${part.id}`}>
                      <HardwareIllustration category={part.category} name={part.name} className="part-choice-image" />
                      <div className="part-choice-info">
                        <strong>{part.name}</strong>
                        <small>{part.specs}</small>
                      </div>
                      <span className="price">{inr(part.price)}</span>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="compact-button" onClick={() => selectPart(part)} data-testid={`button-add-${part.id}`}>
                          {selection[part.category]?.id === part.id ? 'SELECTED' : selection[part.category] ? 'REPLACE WITH THIS' : 'ADD TO BUILD'}
                        </button>
                      </div>
                    </article>
                  ))}
                  <p className="disclaimer">Indicative price — not a live retailer price. Model and specification details can vary by revision.</p>
                </div>
              ) : (
                <>
                  <div className="pc-preview" aria-label="Stylised PC preview; not an exact model of selected components">
                    <div className="preview-mini-tower">
                      <span className="preview-mini-fan" />
                      <span className="preview-mini-gpu" />
                    </div>
                    <span className="preview-caption">ILLUSTRATIVE BUILD PREVIEW · NOT A 3D MODEL</span>
                  </div>
                  <div className="summary-list" data-testid="build-selected-list">
                {builderCategories.filter(({ id }) => selection[id]).map(({ id, label }) => {
                  const part = selection[id];
                  return (
                      <div className="summary-row" key={id}>
                        <span>{label}</span>
                    <div className="summary-part">
                      <strong>{part?.name}</strong>
                      <small>{part?.specs} · {inr(part?.price ?? 0)}</small>
                    </div>
                      </div>
                  );
                })}
                    {compatibility.selectedCount === 0 && (
                      <div className="picker-empty">Your build starts here. Choose a component from the list to see it in your overview.</div>
                    )}
                  </div>
                  <div className="price-total">
                    <span>Estimated selected-parts total</span>
                    <strong data-testid="text-build-total">{inr(total)}</strong>
                  </div>
                  <p className="disclaimer">Indicative estimate only—not a live retailer price, current availability, or final system cost. Prices are catalogue examples and can change.</p>
                </>
              )}
            </section>

            <aside className="panel panel-pad" aria-labelledby="build-summary-title">
              <div className="panel-title">
                <h2 id="build-summary-title">Build summary</h2>
                <Info size={15} color="#7da4b5" />
              </div>
              <div className="counter-note" data-testid="text-parts-count">
                {compatibility.selectedCount} categories selected · {compatibility.missing.length} still missing
              </div>
              <div className="price-total">
                <span>Current estimate</span>
                <strong>{inr(total)}</strong>
              </div>
              <p className="disclaimer">Only selected parts are included. Optional budget is a guide, not a purchase quote.</p>
              <div className="budget-field">
                <label htmlFor="target-budget">Optional target budget (₹)</label>
                <input
                  id="target-budget"
                  className="field"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="For example, 75000"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  data-testid="input-target-budget"
                />
                {budgetNumber > 0 && (
                  <div className={`budget-result ${total > budgetNumber ? 'over' : 'under'}`} data-testid="text-budget-result">
                    {total > budgetNumber
                      ? `${inr(total - budgetNumber)} over target`
                      : `${inr(budgetNumber - total)} remaining`}
                  </div>
                )}
              </div>
              <div className={`compat-status ${compatibility.state}`} data-testid="status-compatibility">
                {compatibility.state === 'compatible' ? <CheckCircle2 size={15} /> : compatibility.state === 'warning' ? <CircleAlert size={15} /> : compatibility.state === 'verify' ? <Info size={15} /> : <BookOpen size={15} />}
                {compatibility.label}
              </div>
              <ul className="compat-list" data-testid="list-compatibility-notes">
                {compatibility.reasons.map((reason, index) => <li key={`${reason}-${index}`}>{reason}</li>)}
              </ul>
              {compatibility.missing.length > 0 && (
                <p className="disclaimer">Still to choose: {compatibility.missing.join(', ')}.</p>
              )}
              <div className="builder-actions">
                    <button className="button" onClick={orderBuild} disabled={!compatibility.selectedCount} data-testid="button-order-build">
                      <ShoppingCart size={13} /> ORDER THIS BUILD
                    </button>
                <button className="button subtle" onClick={exportBuild} data-testid="button-export-build">
                  <Download size={13} /> EXPORT
                </button>
                <button className="button subtle danger" onClick={resetBuild} data-testid="button-reset-build">
                  <RotateCcw size={13} /> RESET
                </button>
              </div>
            </aside>
          </div>
          <p className="disclaimer">Compatibility guidance uses the catalogue’s recorded properties and simple rules. It is not a substitute for checking exact SKU, BIOS, clearance, connector, and installation documentation.</p>
        </section>

        <section id="learn" className="container section">
          <div className="page-heading">
            <div className="eyebrow">Learn / PC Knowledge Hub</div>
            <h1>Build your understanding, too.</h1>
            <p className="section-intro">Short, plain-language explainers for the questions every new builder asks. Open a topic, take a quick quiz, and keep exploring.</p>
          </div>
          <div className="learn-layout">
            <div className="topic-list">
              {learningTopics.map((topic, index) => (
                <details className="topic-item" key={topic.title} open={index === 0}>
                  <summary>{topic.title}<ChevronDown size={15} /></summary>
                  <p>{topic.body}</p>
                </details>
              ))}
            </div>
            <aside className="panel quiz-panel" aria-labelledby="quiz-title">
              <div className="eyebrow">Check what you know</div>
              <h2 id="quiz-title">Hardware quick quiz</h2>
              {!quizFinished ? (
                <>
                  <div className="quiz-progress">QUESTION {quizIndex + 1} / {quizQuestions.length}</div>
                  <p className="quiz-question">{quizQuestions[quizIndex].question}</p>
                  <div className="quiz-options">
                    {quizQuestions[quizIndex].choices.map((choice, index) => {
                      const correct = index === quizQuestions[quizIndex].answer;
                      const chosenWrong = quizAnswer === index && !correct;
                      return (
                        <button
                          className={`quiz-option${quizAnswer !== null && correct ? ' correct' : ''}${chosenWrong ? ' incorrect' : ''}`}
                          key={choice}
                          disabled={quizAnswer !== null}
                          onClick={() => answerQuiz(index)}
                          data-testid={`button-quiz-choice-${index}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  {quizAnswer !== null && (
                    <div className="quiz-explanation" role="status">
                      {quizAnswer === quizQuestions[quizIndex].answer ? 'That’s right. ' : 'Not quite. '}
                      {quizQuestions[quizIndex].explanation}
                    </div>
                  )}
                  <div className="quiz-footer">
                    <span>Score: {quizScore} / {quizIndex + (quizAnswer === null ? 0 : 1)}</span>
                    {quizAnswer !== null && (
                      <button className="button subtle" onClick={nextQuizQuestion} data-testid="button-quiz-next">
                        {quizIndex === quizQuestions.length - 1 ? 'SEE RESULT' : 'NEXT QUESTION'} <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="quiz-question">You scored {quizScore} out of {quizQuestions.length}.</p>
                  <p className="muted" style={{ fontSize: 12, lineHeight: 1.75 }}>Every build gets easier when you know what to verify. Revisit any topic, then have another go.</p>
                  <button className="button" onClick={restartQuiz} data-testid="button-quiz-restart"><RotateCcw size={13} /> RESTART QUIZ</button>
                </>
              )}
            </aside>
          </div>
        </section>

        <section id="about" className="container section">
          <div className="page-heading">
            <div className="eyebrow">About the project</div>
            <h1>Technology should be easier to understand.</h1>
          </div>
          <div className="about-card">
            <div className="eyebrow">An educational project</div>
            <p>NEXUS PC LAB is an educational PC hardware exploration and configuration platform designed to make computer components easier to understand. Users can explore hardware, learn essential specifications, compare component options, estimate a build's cost, and investigate compatibility requirements before assembling a computer.</p>
            <p>This first version is a learning tool—not a retailer, live stock checker, or guarantee that a particular configuration will fit. Always confirm exact product specifications and prices before a purchase.</p>
            <div className="creator-line">Created by Parin &amp; Uday</div>
          </div>
        </section>

        <section id="shop" hidden={activeSection !== 'shop'} className="store-view">
          <Storefront
            cartLines={cartLines}
            onCartChange={setCartLines}
            onCheckout={checkoutCart}
            onRequestPart={() => goTo('requests')}
          />
        </section>

        <section id="cart" hidden={activeSection !== 'cart'} className="store-view">
          <Storefront
            cartLines={cartLines}
            onCartChange={setCartLines}
            onCheckout={checkoutCart}
            onRequestPart={() => goTo('requests')}
          />
        </section>

        <section id="checkout" hidden={activeSection !== 'checkout'} className="store-view">
          {checkoutSelection ? (
            <CheckoutFlow
              lines={checkoutSelection.lines}
              buildOrder={checkoutSelection.buildOrder}
              compatibilityNotes={checkoutSelection.compatibilityNotes}
              onBack={returnFromCheckout}
              onOrderCreated={handleOrderCreated}
            />
          ) : (
            <div className="container section">
              <p className="picker-empty">Choose hardware from the shop or build a PC before checkout.</p>
              <button className="button" onClick={() => goTo('shop')}>OPEN HARDWARE SHOP</button>
            </div>
          )}
        </section>

        <section id="orders" hidden={activeSection !== 'orders'} className="store-view">
          <MyOrders
            orders={orders}
            onClearOrders={() => {
              clearOrders();
              setOrders([]);
            }}
          />
        </section>

        <section id="requests" hidden={activeSection !== 'requests'} className="store-view">
          <PartRequestFlow requests={requests} onRequestsChange={handleRequestsChange} />
        </section>
      </main>

      <footer className="footer" inert={introVisible}>
        <div className="container footer-inner">
          <div className="brand">
            <span className="brand-mark"><Cpu size={16} /></span>
            <span>NEXUS PC LAB<small>PC BUILDER &amp; HARDWARE LEARNING LAB</small></span>
          </div>
          <small>Educational project by Parin &amp; Uday. Indicative examples only; no retailer affiliation.</small>
          <div className="footer-links">
            <button onClick={() => goTo('explorer')}>Hardware</button>
            <button onClick={() => goTo('builder')}>Builder</button>
            <button onClick={() => goTo('shop')}>Hardware Shop</button>
            <button onClick={() => goTo('orders')}>My Orders</button>
            <button onClick={() => goTo('requests')}>My Requests</button>
            <button onClick={() => goTo('learn')}>Knowledge Hub</button>
            <button onClick={() => goTo('about')}>About</button>
          </div>
        </div>
      </footer>

      {showBackTop && (
        <button className="back-top" onClick={() => goTo('home')} aria-label="Back to top" data-testid="button-back-to-top">
          <ArrowUp size={17} />
        </button>
      )}

      {selectedDetail && (
        <div
          className="detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDetail(null);
            }
          }}
          role="presentation"
        >
          <section className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <div className="detail-header">
              <div>
                <div className="eyebrow">Hardware field guide</div>
                <h2 id="detail-title">{selectedDetail.name}</h2>
                <p>{selectedDetail.description}</p>
              </div>
              <button className="icon-button" onClick={() => setSelectedDetail(null)} aria-label="Close hardware detail" data-testid="button-close-hardware-detail">
                <X size={17} />
              </button>
            </div>
            <HardwareIllustration category={selectedDetail.id} name={selectedDetail.name} className="detail-hero-image" />
            {hardwareParts.some((part) => part.category === selectedDetail.id) && (
              <section className="detail-models" aria-label={`Available ${selectedDetail.name} models`}>
                <div className="detail-model-heading">
                  <h3>Models to compare</h3>
                  <span>{hardwareParts.filter((part) => part.category === selectedDetail.id).length} options</span>
                </div>
                <div className="detail-model-grid">
                  {hardwareParts.filter((part) => part.category === selectedDetail.id).map((part) => (
                    <article className="detail-model-card" key={part.id}>
                      <HardwareIllustration category={part.category} name={part.name} className="detail-model-image" />
                      <strong>{part.name}</strong>
                      <small>{part.specs}</small>
                      <span className="detail-model-price">{inr(part.price)} <em>indicative</em></span>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <div className="detail-content-grid">
              <div>
                <h3>What it is—and why it matters</h3>
                <p>{selectedDetail.what}</p>
                <p>{selectedDetail.why}</p>
                <h3>Buying considerations</h3>
                <p>{selectedDetail.buying}</p>
                <h3>Compatibility notes</h3>
                <p>{selectedDetail.compatibility}</p>
                <h3>Specification checklist</h3>
                <p>{selectedDetail.terms.map((term) => term.term).join(' · ')}</p>
              </div>
              <div>
                <h3>Terms, in plain language</h3>
                {selectedDetail.terms.map((term) => (
                  <div className="term-line" key={term.term}><strong>{term.term}</strong>{term.meaning}</div>
                ))}
                {!hardwareParts.some((part) => part.category === selectedDetail.id) && (
                  <>
                    <h3>Model examples</h3>
                    <ul className="detail-example-list">
                      {selectedDetail.examples.map((example) => (
                        <li key={example}>
                          <HardwareIllustration category={selectedDetail.id} name={example} className="detail-example-image" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="disclaimer">Indicative price — not a live retailer price. {selectedDetail.price}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PcTower() {
  return (
    <div className="tower-visual" aria-hidden="true">
      <div className="tower-front" />
      <div className="tower-line" />
      <div className="tower-gpu" />
      <div className="tower-board" />
      <div className="tower-base" />
    </div>
  );
}

export default App;

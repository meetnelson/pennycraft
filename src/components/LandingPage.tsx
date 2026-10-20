import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowDown,
  Layers,
  ShoppingBag,
  Sliders,
  AlertTriangle,
  Check,
  Cloud,
  RefreshCw,
  Clock,
  Package,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';

interface LandingPageProps {
  onOpenStudio: () => void;
  onOpenCloudModal: () => void;
  onLogoClick?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenStudio,
  onOpenCloudModal,
  onLogoClick,
}) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleNavigateStudio = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenStudio();
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setIsFeedbackOpen(false);
      setFeedbackSent(false);
      setFeedbackText('');
      setFeedbackEmail('');
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFA] text-[#303C36] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-nowrap h-16 px-6 bg-white/90 backdrop-blur-md rounded-3xl border border-[#E8ECE9] shadow-sm my-4 gap-4">
          {/* Left: Brand Logo */}
          <a
            href="/"
            onClick={(e) => {
              if (onLogoClick) {
                e.preventDefault();
                onLogoClick();
              }
            }}
            className="flex items-center gap-3 shrink-0 whitespace-nowrap group"
          >
            <img
              src="/images/pennycraft-linear.svg"
              alt="PennyCraft — Smart Pricing Studio"
              className="h-7 sm:h-8 lg:h-9 w-auto block group-hover:scale-[1.01] transition-transform"
            />
          </a>

          {/* Right: Links + Pill CTA */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0 whitespace-nowrap">
            <nav
              aria-label="Landing Navigation"
              className="hidden md:flex items-center gap-6 text-xs font-medium text-[#63726A]"
            >
              <a
                href="#how-it-works"
                className="hover:text-[#303C36] transition-colors"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="hover:text-[#303C36] transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="hover:text-[#303C36] transition-colors"
              >
                FAQ
              </a>
            </nav>

            <a
              href="/app"
              onClick={handleNavigateStudio}
              className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] active:scale-[0.99] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs transition-all"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E8A184]" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-24">
        {/* SECTION 1: HERO (ABOVE THE FOLD) */}
        <section className="pt-4 sm:pt-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8ECE9] shadow-2xs text-xs font-medium text-[#63726A]">
              <img
                src="/images/pennycraft-icon.svg"
                alt=""
                className="h-3.5 w-auto"
              />
              <span>Built for independent crafters, makers & studio owners</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold text-[#303C36] tracking-tight leading-[1.12]">
              Price your crafts with confidence.{' '}
              <span className="text-[#42685B]">
                Know your margin down to the penny.
              </span>
            </h1>

            <p className="text-base sm:text-lg font-normal text-[#63726A] leading-relaxed max-w-2xl mx-auto">
              The smart, no-nonsense pricing calculator for makers, paper
              crafters, and independent artisans. Calculate material costs,
              track handcrafting time, and stack visual pricing rules in
              seconds.
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <a
                href="/app"
                onClick={handleNavigateStudio}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#42685B] hover:bg-[#36544a] active:scale-[0.99] text-white text-sm font-semibold px-7 py-3.5 rounded-full shadow-[0_10px_25px_-5px_rgba(66,104,91,0.28)] transition-all"
              >
                <span>Open Studio Free — No Sign-up Needed</span>
                <ArrowRight className="w-4 h-4 text-[#E8A184]" />
              </a>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAFBFA] text-[#303C36] border border-[#E8ECE9] text-sm font-medium px-6 py-3.5 rounded-full shadow-2xs transition-all"
              >
                <span>See How It Works</span>
                <ArrowDown className="w-4 h-4 text-[#63726A]" />
              </a>
            </div>
          </div>

          {/* Hero Visual / Mockup Preview Card */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl border border-[#E8ECE9] shadow-[0_16px_50px_rgb(48,60,54,0.06)] p-6 sm:p-8 lg:p-10">
              {/* Mockup Window Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-[#E8ECE9]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-semibold text-[#303C36]">
                        Floral Hardcover Spiral Planner A5
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#B8C9BD]/25 text-[#42685B] text-[11px] font-medium">
                        Planners & Journals
                      </span>
                    </div>
                    <p className="text-xs text-[#63726A]">
                      Live Recipe & Modular Pricing Pipeline Preview
                    </p>
                  </div>
                </div>

                <a
                  href="/app"
                  onClick={handleNavigateStudio}
                  className="text-xs font-medium text-[#42685B] hover:text-[#36544a] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Try interactive calculator</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E8A184]" />
                </a>
              </div>

              {/* Side-by-Side Recipe & Pipeline Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left: Product Recipe Breakdown */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium text-[#63726A] pb-1 border-b border-[#E8ECE9]">
                      <span>PRODUCT RECIPE (MATERIALS & TIME)</span>
                      <span>UNIT COST</span>
                    </div>

                    <div className="divide-y divide-[#E8ECE9] text-xs">
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className="w-3.5 h-3.5 text-[#E8A184] shrink-0" />
                          <span className="font-medium text-[#303C36] truncate">
                            Offset Paper 90gsm
                          </span>
                          <span className="text-[#63726A]">80 un</span>
                        </div>
                        <span className="font-medium text-[#303C36]">$2.24</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className="w-3.5 h-3.5 text-[#E8A184] shrink-0" />
                          <span className="font-medium text-[#303C36] truncate">
                            Grey Chipboard 2mm + Linen Cloth
                          </span>
                          <span className="text-[#63726A]">2 sheets</span>
                        </div>
                        <span className="font-medium text-[#303C36]">$3.65</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Package className="w-3.5 h-3.5 text-[#E8A184] shrink-0" />
                          <span className="font-medium text-[#303C36] truncate">
                            Kraft Mailer Box + Tissue Wrap
                          </span>
                          <span className="text-[#63726A]">1 set</span>
                        </div>
                        <span className="font-medium text-[#303C36]">$1.15</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-[#E8A184] shrink-0" />
                          <span className="font-medium text-[#303C36] truncate">
                            Focused Binding & Finishing ($24/hr)
                          </span>
                          <span className="text-[#63726A]">25 min</span>
                        </div>
                        <span className="font-medium text-[#303C36]">$10.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAFBFA] border border-[#E8ECE9] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#63726A]">
                      Base Production Cost (Materials + Packaging + Labor)
                    </span>
                    <span className="text-sm font-semibold text-[#303C36]">
                      $17.04
                    </span>
                  </div>
                </div>

                {/* Right: Modular Pricing Rule Pipeline */}
                <div className="lg:col-span-6 bg-[#FAFBFA] rounded-3xl p-6 border border-[#E8ECE9] flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#303C36]">
                        <Sliders className="w-3.5 h-3.5 text-[#42685B]" />
                        <span>Active Rule: Etsy Online Store</span>
                      </span>
                      <span className="text-[11px] text-[#63726A]">
                        5 blocks stacked
                      </span>
                    </div>

                    {/* Visual Formula Breadcrumb */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: 'Materials', isMargin: false },
                        { label: 'Labor', isMargin: false },
                        { label: 'Packaging', isMargin: false },
                        { label: '+60% Margin', isMargin: true },
                        { label: '+6.5% Etsy Fee', isMargin: false },
                      ].map((pill, idx, arr) => (
                        <React.Fragment key={pill.label}>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-2xs border ${
                              pill.isMargin
                                ? 'bg-[#FDF3F0] border-[#E8A184]/50 text-[#C66746]'
                                : 'bg-white border-[#E8ECE9] text-[#303C36]'
                            }`}
                          >
                            {pill.label}
                          </span>
                          {idx < arr.length - 1 && (
                            <span className="text-[#63726A] font-normal text-xs">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Hero Suggested Retail Output */}
                  <div className="bg-white rounded-2xl p-5 border border-[#E8ECE9] shadow-2xs space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-medium text-[#63726A] block">
                          Suggested Retail Price
                        </span>
                        <span className="text-3xl font-bold text-[#42685B] tracking-tight mt-0.5 block">
                          $29.03
                        </span>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDF3F0] text-[#C66746] border border-[#E8A184]/50 text-xs font-semibold">
                        +$10.22 net profit
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E8ECE9] text-xs">
                      <div>
                        <span className="text-[#63726A] block">Cost to Make</span>
                        <span className="font-semibold text-[#303C36] mt-0.5 block">
                          $17.04
                        </span>
                      </div>
                      <div>
                        <span className="text-[#63726A] block">Net Margin</span>
                        <span className="font-semibold text-[#C66746] mt-0.5 block">
                          35.2%
                        </span>
                      </div>
                      <div>
                        <span className="text-[#63726A] block">Platform Fee</span>
                        <span className="font-semibold text-[#42685B] mt-0.5 block">
                          $1.77
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS (THE 3 STUDIO PILLARS) */}
        <section id="how-it-works" className="scroll-mt-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#42685B]">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#303C36] tracking-tight">
              Three simple steps from raw supplies to profitable retail prices
            </h2>
            <p className="text-sm sm:text-base text-[#63726A]">
              Designed for creative minds—no complex spreadsheets or factory
              jargon required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-7 border border-[#E8ECE9] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#303C36]">
                  1. Track Materials & Real Time
                </h3>
                <p className="text-sm text-[#63726A] leading-relaxed">
                  Log papers, fabrics, packaging, and your hourly focus rate.
                  PennyCraft automatically computes fractional unit costs down
                  to the sheet, centimeter, or minute.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E8ECE9] flex items-center justify-between text-xs text-[#63726A]">
                <span>Imperial, Metric & Area units</span>
                <span className="font-medium text-[#42685B]">
                  Auto-converted
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-7 border border-[#E8ECE9] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#303C36]">
                  2. Build Craft Recipes
                </h3>
                <p className="text-sm text-[#63726A] leading-relaxed">
                  Assemble product BOMs with one click. Mix raw supplies,
                  mailing boxes, and crafting minutes into an exact base
                  production cost.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E8ECE9] flex items-center justify-between text-xs text-[#63726A]">
                <span>Materials + Packaging + Labor</span>
                <span className="font-medium text-[#303C36]">
                  Exact cost to make
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-7 border border-[#E8ECE9] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#FDF3F0] border border-[#E8A184]/50 text-[#C66746] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#303C36]">
                  3. Stack Modular Rules
                </h3>
                <p className="text-sm text-[#63726A] leading-relaxed">
                  Assemble pricing formulas like blocks. Apply profit margins,
                  platform fees (Etsy/Shopify), or wholesale discounts in any
                  sequence with instant price updates.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E8ECE9] flex items-center justify-between text-xs text-[#63726A]">
                <span>Retail, Etsy & Wholesale</span>
                <span className="font-medium text-[#C66746]">
                  Reusable rules
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INFLATION & STALE PRICE ALERTS (KEY DIFFERENTIATOR CARD) */}
        <section className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#E8ECE9] shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF3F0] border border-[#E8A184]/50 text-[#C66746] text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Smart Margin Protection</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#303C36] tracking-tight">
                Never lose money to hidden inflation.
              </h2>

              <p className="text-sm sm:text-base text-[#63726A] leading-relaxed">
                Supplier prices creep up quietly. PennyCraft automatically warns
                you when raw supply prices haven&apos;t been verified in{' '}
                <strong className="font-semibold text-[#303C36]">
                  90 days
                </strong>{' '}
                and flags every finished product affected by supplier price
                hikes—so you can recalculate your catalog in one click.
              </p>
            </div>

            <div className="lg:col-span-5 bg-[#FAFBFA] rounded-2xl p-5 border border-[#E8ECE9] space-y-3">
              <div className="bg-white rounded-2xl p-3.5 border border-[#E8A184]/60 flex items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#303C36] block truncate">
                    Bookbinding Linen Cloth
                  </span>
                  <span className="text-[11px] text-[#63726A]">
                    Last updated 98 days ago
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDF3F0] text-[#C66746] border border-[#E8A184]/50 text-[11px] font-medium shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Check price</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-[#E8ECE9] flex items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#303C36] block truncate">
                    2 Products Affected by Cost Change
                  </span>
                  <span className="text-[11px] text-[#63726A]">
                    Cascade impact detected automatically
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#42685B] text-white text-[11px] font-medium shrink-0">
                  <RefreshCw className="w-3 h-3 text-[#E8A184]" />
                  <span>Update All</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: TRANSPARENT PRICING (LOCAL-FIRST VS. CLOUD) */}
        <section id="pricing" className="scroll-mt-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#42685B]">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#303C36] tracking-tight">
              Start free in your browser. Upgrade only if you want cloud sync.
            </h2>
            <p className="text-sm sm:text-base text-[#63726A]">
              No paywalls on features or product limits. Use PennyCraft locally
              forever, or back up your studio in the cloud.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Card 1: Free Forever (Local Studio) */}
            <div className="bg-white rounded-3xl p-7 sm:p-8 border border-[#E8ECE9] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                {/* Symmetrical Badge + Balanced Two-Line Title Header */}
                <div className="space-y-3">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAFBFA] border border-[#E8ECE9] text-[#63726A] text-xs font-medium whitespace-nowrap">
                      No account required
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#303C36] leading-snug whitespace-normal">
                    Free Forever{' '}
                    <span className="block sm:inline font-medium text-[#63726A] text-base">
                      (Local Studio)
                    </span>
                  </h3>
                </div>

                {/* Symmetrical Price Block */}
                <div className="min-h-[64px] flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#303C36] tracking-tight">
                      $0
                    </span>
                    <span className="text-xs font-normal text-[#63726A]">
                      Free for life
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-xs font-normal text-[#63726A]">
                    100% private in your browser
                  </span>
                </div>

                <ul className="space-y-3 pt-2 border-t border-[#E8ECE9] text-sm text-[#63726A]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Complete recipe builder &amp; cost engine</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Unlimited materials, packaging &amp; labor rates</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Modular pricing rule pipeline</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Saved directly in your browser (LocalStorage)</span>
                  </li>
                </ul>
              </div>

              <a
                href="/app"
                onClick={handleNavigateStudio}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#FAFBFA] hover:bg-[#B8C9BD]/25 border border-[#E8ECE9] text-[#303C36] font-semibold text-sm py-3 px-6 rounded-2xl transition-colors"
              >
                <span>Start Crafting Free</span>
                <ArrowRight className="w-4 h-4 text-[#42685B]" />
              </a>
            </div>

            {/* Card 2: Studio Cloud (Early Supporter) */}
            <div className="bg-white rounded-3xl p-7 sm:p-8 border-2 border-[#42685B] shadow-[0_14px_40px_rgb(66,104,91,0.10)] flex flex-col justify-between space-y-8 relative">
              <div className="space-y-6">
                {/* Symmetrical Badge + Balanced Two-Line Title Header */}
                <div className="space-y-3">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDF3F0] text-[#C66746] border border-[#E8A184]/50 text-xs font-semibold whitespace-nowrap">
                      Most Popular for Active Sellers
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#303C36] leading-snug whitespace-normal">
                    Studio Cloud{' '}
                    <span className="block sm:inline font-medium text-[#63726A] text-base">
                      (Early Supporter)
                    </span>
                  </h3>
                </div>

                {/* Symmetrical Price Block */}
                <div className="min-h-[64px] flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#42685B] tracking-tight">
                      $1.99
                    </span>
                    <span className="text-xs font-normal text-[#63726A]">
                      / month or{' '}
                      <strong className="text-[#303C36]">$12 / year</strong>
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-xs font-medium text-[#C66746]">
                    Save 50% with annual billing
                  </span>
                </div>

                <ul className="space-y-3 pt-2 border-t border-[#E8ECE9] text-sm text-[#63726A]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Automatic Cloud Backup across all your devices</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>
                      Instant access from your phone at craft fairs &amp;
                      markets
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#42685B] shrink-0 mt-0.5" />
                    <span>Support independent craft software development</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onOpenCloudModal}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#42685B] hover:bg-[#36544a] text-white font-semibold text-sm py-3 px-6 rounded-2xl shadow-xs transition-all"
              >
                <Cloud className="w-4 h-4 text-[#E8A184]" />
                <span>Upgrade to Cloud</span>
              </button>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#42685B]">
              FAQ
            </span>
            <h2 className="text-2xl font-bold text-[#303C36] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECE9] space-y-2">
              <h3 className="text-sm font-semibold text-[#303C36]">
                Do I really not need an account to start?
              </h3>
              <p className="text-xs sm:text-sm text-[#63726A] leading-relaxed">
                Correct! Click &ldquo;Open Studio&rdquo; and start building your
                recipes right away. Your data is stored privately in your
                browser&apos;s LocalStorage.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E8ECE9] space-y-2">
              <h3 className="text-sm font-semibold text-[#303C36]">
                What happens to my local items if I sign in later?
              </h3>
              <p className="text-xs sm:text-sm text-[#63726A] leading-relaxed">
                When you sign in to Studio Cloud for the first time, PennyCraft
                automatically migrates your local materials, recipes, and
                pricing rules to your cloud account.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E8ECE9] space-y-2">
              <h3 className="text-sm font-semibold text-[#303C36]">
                Can I create separate rules for Etsy, Retail, and Wholesale?
              </h3>
              <p className="text-xs sm:text-sm text-[#63726A] leading-relaxed">
                Yes. You can build unlimited Pricing Rules with different
                margins, platform fees, or wholesale discounts, and switch a
                product&apos;s rule anytime to compare prices.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E8ECE9] space-y-2">
              <h3 className="text-sm font-semibold text-[#303C36]">
                Which measurement units are supported?
              </h3>
              <p className="text-xs sm:text-sm text-[#63726A] leading-relaxed">
                PennyCraft supports pieces, packs, pairs, linear units (cm, m,
                in, ft, yd), area (sq ft, sq m, sq in), weight (g, kg, oz, lb),
                and volume (ml, l, fl oz).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 5: MINIMALIST FOOTER */}
      <footer className="border-t border-[#E8ECE9] bg-white/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#63726A]">
          <div className="flex items-center gap-2.5 text-[#303C36] font-medium">
            <img
              src="/images/pennycraft-icon.svg"
              alt="PennyCraft"
              className="h-4 w-auto"
            />
            <span>PennyCraft — Handcrafted software for independent makers.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAFBFA] text-[#63726A] hover:text-[#303C36] border border-[#E8ECE9] font-medium transition-all cursor-pointer shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#E8A184]" />
              <span>Suggest a feature / Feedback</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-[#E8ECE9] text-center sm:text-left text-[11px] text-[#63726A]">
          Pricing recommendations are estimations based on user inputs. Not
          formal financial advice.
        </div>
      </footer>

      {/* Clean Feedback Modal with Direct Email Option */}
      {isFeedbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#303C36]/20 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFeedbackOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-[0_14px_40px_rgb(0,0,0,0.08)] w-full max-w-md overflow-hidden border border-[#E8ECE9] p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#303C36]">
                    Suggest a Feature / Feedback
                  </h3>
                  <p className="text-xs text-[#63726A]">
                    Help us shape PennyCraft for your studio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(false)}
                className="p-1.5 rounded-full text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSent ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#42685B]/10 text-[#42685B] flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#303C36]">
                  Thank you for your feedback!
                </p>
                <p className="text-xs text-[#63726A]">
                  We read every note from fellow makers.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                    Your Idea or Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g., I'd love to see a bulk CSV import for paper supplies..."
                    className="w-full px-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-xs sm:text-sm text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="w-full px-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-xs sm:text-sm text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E8ECE9]">
                  <a
                    href="mailto:support@pennycraft.app?subject=PennyCraft%20Feedback"
                    className="text-xs text-[#63726A] hover:text-[#42685B] underline underline-offset-2 transition-colors"
                  >
                    Or email support@pennycraft.app
                  </a>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(false)}
                      className="px-4 py-2 rounded-full text-xs text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-[#E8A184]" />
                      <span>Send Feedback</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

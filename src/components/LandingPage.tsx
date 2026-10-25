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
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3134] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-nowrap h-16 px-6 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm my-4 gap-4">
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
              src="/images/formulo-linear-clean.svg"
              alt="Formulo — Smart Pricing Studio for Makers"
              className="h-7 md:h-8 w-auto block group-hover:scale-[1.01] transition-transform"
            />
          </a>

          {/* Right: Links + Pill CTA */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0 whitespace-nowrap">
            <nav
              aria-label="Landing Navigation"
              className="hidden md:flex items-center gap-6 text-xs font-medium text-[#64748B]"
            >
              <a
                href="#how-it-works"
                className="hover:text-[#2D3134] transition-colors"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="hover:text-[#2D3134] transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="hover:text-[#2D3134] transition-colors"
              >
                FAQ
              </a>
            </nav>

            <a
              href="/app"
              onClick={handleNavigateStudio}
              className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] active:scale-[0.99] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F4B266]" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-24">
        {/* SECTION 1: HERO (ABOVE THE FOLD) */}
        <section className="pt-4 sm:pt-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-medium text-[#64748B]">
              <img
                src="/images/formulo-icon.svg"
                alt="Formulo"
                className="h-4 w-auto"
              />
              <span>Built for independent crafters, makers &amp; studio owners</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold text-[#2D3134] tracking-tight leading-[1.12]">
              Know your costs.{' '}
              <span className="text-[#2A8C82]">
                Price with confidence.
              </span>
            </h1>

            <p className="text-base sm:text-lg font-normal text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Visual pricing recipes, batch calculations, and profit margins for
              craft studios. Calculate material costs, track handcrafting time,
              and stack modular pricing rules in seconds.
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <a
                href="/app"
                onClick={handleNavigateStudio}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#2A8C82] hover:bg-[#23736B] active:scale-[0.99] text-white text-sm font-semibold px-7 py-3.5 rounded-2xl shadow-sm transition-all"
              >
                <span>Open Studio Free — No Sign-up Needed</span>
                <ArrowRight className="w-4 h-4 text-[#F4B266]" />
              </a>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-sm font-medium px-6 py-3.5 rounded-2xl shadow-sm transition-all"
              >
                <span>See How It Works</span>
                <ArrowDown className="w-4 h-4 text-[#64748B]" />
              </a>
            </div>
          </div>

          {/* Hero Visual / Mockup Preview Card */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:p-10">
              {/* Mockup Window Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-semibold text-[#2D3134]">
                        Floral Hardcover Spiral Planner A5
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] text-[11px] font-medium">
                        Planners &amp; Journals
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Live Recipe &amp; Modular Pricing Pipeline Preview
                    </p>
                  </div>
                </div>

                <a
                  href="/app"
                  onClick={handleNavigateStudio}
                  className="text-xs font-medium text-[#2A8C82] hover:text-[#23736B] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Try interactive calculator</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E78358]" />
                </a>
              </div>

              {/* Side-by-Side Recipe & Pipeline Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left: Product Recipe Breakdown */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium text-[#64748B] pb-1 border-b border-slate-200">
                      <span>PRODUCT RECIPE (MATERIALS &amp; TIME)</span>
                      <span>UNIT COST</span>
                    </div>

                    <div className="divide-y divide-slate-200 text-xs">
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className="w-3.5 h-3.5 text-[#E78358] shrink-0" />
                          <span className="font-medium text-[#2D3134] truncate">
                            Offset Paper 90gsm
                          </span>
                          <span className="text-[#64748B]">80 un</span>
                        </div>
                        <span className="font-medium text-[#2D3134]">$2.24</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className="w-3.5 h-3.5 text-[#E78358] shrink-0" />
                          <span className="font-medium text-[#2D3134] truncate">
                            Grey Chipboard 2mm + Linen Cloth
                          </span>
                          <span className="text-[#64748B]">2 sheets</span>
                        </div>
                        <span className="font-medium text-[#2D3134]">$3.65</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Package className="w-3.5 h-3.5 text-[#F4B266] shrink-0" />
                          <span className="font-medium text-[#2D3134] truncate">
                            Kraft Mailer Box + Tissue Wrap
                          </span>
                          <span className="text-[#64748B]">1 set</span>
                        </div>
                        <span className="font-medium text-[#2D3134]">$1.15</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-[#2A8C82] shrink-0" />
                          <span className="font-medium text-[#2D3134] truncate">
                            Focused Binding &amp; Finishing ($24/hr)
                          </span>
                          <span className="text-[#64748B]">25 min</span>
                        </div>
                        <span className="font-medium text-[#2D3134]">$10.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#64748B]">
                      Base Production Cost (Materials + Packaging + Labor)
                    </span>
                    <span className="text-sm font-semibold text-[#2D3134]">
                      $17.04
                    </span>
                  </div>
                </div>

                {/* Right: Modular Pricing Rule Pipeline */}
                <div className="lg:col-span-6 bg-[#F8F9FA] rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D3134]">
                        <Sliders className="w-3.5 h-3.5 text-[#2A8C82]" />
                        <span>Active Rule: Etsy Online Store</span>
                      </span>
                      <span className="text-[11px] text-[#64748B]">
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
                                ? 'bg-[#E78358]/10 border-[#E78358]/40 text-[#E78358]'
                                : 'bg-white border-slate-200 text-[#2D3134]'
                            }`}
                          >
                            {pill.label}
                          </span>
                          {idx < arr.length - 1 && (
                            <span className="text-[#64748B] font-normal text-xs">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Hero Suggested Retail Output */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-medium text-[#64748B] block">
                          Suggested Retail Price
                        </span>
                        <span className="text-3xl font-bold text-[#2A8C82] tracking-tight mt-0.5 block">
                          $29.03
                        </span>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-xs font-semibold">
                        +$10.22 net profit
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-[#64748B] block">Cost to Make</span>
                        <span className="font-semibold text-[#2D3134] mt-0.5 block">
                          $17.04
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">Net Margin</span>
                        <span className="font-semibold text-[#E78358] mt-0.5 block">
                          35.2%
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">Platform Fee</span>
                        <span className="font-semibold text-[#2A8C82] mt-0.5 block">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2A8C82]">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3134] tracking-tight">
              Three simple steps from raw supplies to profitable retail prices
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Designed for creative minds—no complex spreadsheets or factory
              jargon required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#2D3134]">
                  1. Track Materials &amp; Real Time
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Log papers, fabrics, packaging, and your hourly focus rate.
                  Formulo automatically computes fractional unit costs down
                  to the sheet, centimeter, or minute.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-[#64748B]">
                <span>Imperial, Metric &amp; Area units</span>
                <span className="font-medium text-[#2A8C82]">
                  Auto-converted
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#F4B266]/20 border border-[#F4B266]/40 text-[#E78358] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#2D3134]">
                  2. Build Craft Recipes
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Assemble product BOMs with one click. Mix raw supplies,
                  mailing boxes, and crafting minutes into an exact base
                  production cost.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-[#64748B]">
                <span>Materials + Packaging + Labor</span>
                <span className="font-medium text-[#2D3134]">
                  Exact cost to make
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#2D3134]">
                  3. Stack Modular Rules
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Assemble pricing formulas like blocks. Apply profit margins,
                  platform fees (Etsy/Shopify), or wholesale discounts in any
                  sequence with instant price updates.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-[#64748B]">
                <span>Retail, Etsy &amp; Wholesale</span>
                <span className="font-medium text-[#E78358]">
                  Reusable rules
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INFLATION & STALE PRICE ALERTS (KEY DIFFERENTIATOR CARD) */}
        <section className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Smart Margin Protection</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3134] tracking-tight">
                Never lose money to hidden inflation.
              </h2>

              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Supplier prices creep up quietly. Formulo automatically warns
                you when raw supply prices haven&apos;t been verified in{' '}
                <strong className="font-semibold text-[#2D3134]">
                  90 days
                </strong>{' '}
                and flags every finished product affected by supplier price
                hikes—so you can recalculate your catalog in one click.
              </p>
            </div>

            <div className="lg:col-span-5 bg-[#F8F9FA] rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="bg-white rounded-2xl p-3.5 border border-[#E78358]/40 flex items-center justify-between gap-3 shadow-sm">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#2D3134] block truncate">
                    Bookbinding Linen Cloth
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Last updated 98 days ago
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-[11px] font-medium shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Check price</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between gap-3 shadow-sm">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#2D3134] block truncate">
                    2 Products Affected by Cost Change
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Cascade impact detected automatically
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2A8C82] text-white text-[11px] font-medium shrink-0">
                  <RefreshCw className="w-3 h-3 text-[#F4B266]" />
                  <span>Update All</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: TRANSPARENT PRICING (LOCAL-FIRST VS. CLOUD) */}
        <section id="pricing" className="scroll-mt-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2A8C82]">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3134] tracking-tight">
              Start free in your browser. Upgrade only if you want cloud sync.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              No paywalls on features or product limits. Use Formulo locally
              forever, or back up your studio in the cloud.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Card 1: Free Forever (Local Studio) */}
            <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F8F9FA] border border-slate-200 text-[#64748B] text-xs font-medium whitespace-nowrap">
                      No account required
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3134] leading-snug whitespace-normal">
                    Free Forever{' '}
                    <span className="block sm:inline font-medium text-[#64748B] text-base">
                      (Local Studio)
                    </span>
                  </h3>
                </div>

                <div className="min-h-[64px] flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#2D3134] tracking-tight">
                      $0
                    </span>
                    <span className="text-xs font-normal text-[#64748B]">
                      Free for life
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-xs font-normal text-[#64748B]">
                    100% private in your browser
                  </span>
                </div>

                <ul className="space-y-3 pt-2 border-t border-slate-200 text-sm text-[#64748B]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Complete recipe builder &amp; cost engine</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Unlimited materials, packaging &amp; labor rates</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Modular pricing rule pipeline</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Saved directly in your browser (LocalStorage)</span>
                  </li>
                </ul>
              </div>

              <a
                href="/app"
                onClick={handleNavigateStudio}
                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8F9FA] border border-slate-200 text-[#2D3134] font-semibold text-sm py-3 px-6 rounded-2xl transition-colors"
              >
                <span>Start Crafting Free</span>
                <ArrowRight className="w-4 h-4 text-[#2A8C82]" />
              </a>
            </div>

            {/* Card 2: Studio Cloud (Early Supporter) */}
            <div className="bg-white rounded-2xl p-7 sm:p-8 border-2 border-[#2A8C82] shadow-sm flex flex-col justify-between space-y-8 relative">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-xs font-semibold whitespace-nowrap">
                      Most Popular for Active Sellers
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3134] leading-snug whitespace-normal">
                    Studio Cloud{' '}
                    <span className="block sm:inline font-medium text-[#64748B] text-base">
                      (Early Supporter)
                    </span>
                  </h3>
                </div>

                <div className="min-h-[64px] flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#2A8C82] tracking-tight">
                      $1.99
                    </span>
                    <span className="text-xs font-normal text-[#64748B]">
                      / month or{' '}
                      <strong className="text-[#2D3134]">$12 / year</strong>
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-xs font-medium text-[#E78358]">
                    Save 50% with annual billing
                  </span>
                </div>

                <ul className="space-y-3 pt-2 border-t border-slate-200 text-sm text-[#64748B]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Automatic Cloud Backup across all your devices</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>
                      Instant access from your phone at craft fairs &amp;
                      markets
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2A8C82] shrink-0 mt-0.5" />
                    <span>Support independent craft software development</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onOpenCloudModal}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#2A8C82] hover:bg-[#23736B] text-white font-semibold text-sm py-3 px-6 rounded-2xl shadow-sm transition-all"
              >
                <Cloud className="w-4 h-4 text-[#F4B266]" />
                <span>Upgrade to Cloud</span>
              </button>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2A8C82]">
              FAQ
            </span>
            <h2 className="text-2xl font-bold text-[#2D3134] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-[#2D3134]">
                Do I really not need an account to start?
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Correct! Click &ldquo;Open Studio&rdquo; and start building your
                recipes right away. Your data is stored privately in your
                browser&apos;s LocalStorage.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-[#2D3134]">
                What happens to my local items if I sign in later?
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                When you sign in to Studio Cloud for the first time, Formulo
                automatically migrates your local materials, recipes, and
                pricing rules to your cloud account.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-[#2D3134]">
                Can I create separate rules for Etsy, Retail, and Wholesale?
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Yes. You can build unlimited Pricing Rules with different
                margins, platform fees, or wholesale discounts, and switch a
                product&apos;s rule anytime to compare prices.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-[#2D3134]">
                Which measurement units are supported?
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Formulo supports pieces, packs, pairs, linear units (cm, m,
                in, ft, yd), area (sq ft, sq m, sq in), weight (g, kg, oz, lb),
                and volume (ml, l, fl oz).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 5: MINIMALIST FOOTER */}
      <footer className="border-t border-slate-200 bg-white/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2.5 text-[#2D3134] font-medium">
            <img
              src="/images/formulo-icon.svg"
              alt="Formulo"
              className="h-4 w-auto"
            />
            <span>Formulo — Know your costs. Price with confidence.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8F9FA] text-[#64748B] hover:text-[#2D3134] border border-slate-200 font-medium transition-all cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#E78358]" />
              <span>Suggest a feature / Feedback</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-200 text-center sm:text-left text-[11px] text-[#64748B]">
          Pricing recommendations are estimations based on user inputs. Not
          formal financial advice.
        </div>
      </footer>

      {/* Clean Feedback Modal with Direct Email Option */}
      {isFeedbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3134]/20 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFeedbackOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-sm w-full max-w-md overflow-hidden border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#2D3134]">
                    Suggest a Feature / Feedback
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Help us shape Formulo for your studio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSent ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#2D3134]">
                  Thank you for your feedback!
                </p>
                <p className="text-xs text-[#64748B]">
                  We read every note from fellow makers.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-[#64748B] mb-1.5">
                    Your Idea or Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g., I'd love to see a bulk CSV import for paper supplies..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-xs sm:text-sm text-[#2D3134] placeholder:text-[#64748B] transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-[#64748B] mb-1.5">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-xs sm:text-sm text-[#2D3134] placeholder:text-[#64748B] transition-all"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                  <a
                    href="mailto:support@formulo.app?subject=Formulo%20Feedback"
                    className="text-xs text-[#64748B] hover:text-[#2A8C82] underline underline-offset-2 transition-colors"
                  >
                    Or email support@formulo.app
                  </a>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(false)}
                      className="px-4 py-2 rounded-full text-xs text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-[#F4B266]" />
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

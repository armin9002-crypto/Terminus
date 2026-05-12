import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { CARRY_DISTRIBUTION_CURVE } from "../../lib/constants";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid gap-3 scroll-mt-6">
      <h2 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
        {title}
      </h2>
      <div className="grid gap-2 text-xs leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</p>
      <div className="pl-3 border-l-2 border-[var(--border)] grid gap-1 text-xs text-[var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-2 text-xs text-[var(--text-secondary)]">
      {children}
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-[11px] text-[var(--accent)]">
      {children}
    </div>
  );
}

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "montecarlo", label: "Monte Carlo Method" },
  { id: "returns", label: "Return Model" },
  { id: "assets", label: "Assets" },
  { id: "taxes", label: "Tax Model" },
  { id: "socialsecurity", label: "Social Security" },
  { id: "spending", label: "Spending Model" },
  { id: "carry", label: "Carry Awards" },
  { id: "college", label: "College Costs" },
  { id: "liabilities", label: "Liabilities" },
  { id: "charts", label: "Reading the Charts" },
  { id: "metrics", label: "Key Metrics" },
  { id: "limitations", label: "Known Limitations" },
];

export function InfoPage() {
  const inputs = useSimStore((state) => state.inputs);

  return (
    <div className="grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]">

      {/* Side nav */}
      <nav className="hidden lg:block sticky top-0 h-fit pr-4 border-r border-[var(--border)]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Contents</p>
        <ul className="grid gap-1">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors py-0.5"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="grid gap-8 pl-0 lg:pl-6 max-w-3xl">

        {/* -- OVERVIEW -- */}
        <Section id="overview" title="What is Terminus?">
          <p>
            Terminus is a Monte Carlo retirement simulator built specifically for high-income professionals
            with complex financial pictures: multiple asset buckets, private equity carry, capital call
            obligations, tax-deferred and taxable accounts, Social Security, and multi-phase retirement spending.
          </p>
          <p>
            It is inspired by the "Rich, Broke, or Dead" visualization concept popularized by engaging-data.com
            and extends it with a full tax engine, carry award modeling, spending smile, and real/nominal
            wealth analysis across thousands of simulated futures.
          </p>
          <Callout>
            Every number updates live as you adjust inputs. The model reruns {inputs.numSimulations.toLocaleString()} full
            simulations (each spanning your entire planning horizon) within 400ms of any input change.
          </Callout>
        </Section>

        {/* -- MONTE CARLO -- */}
        <Section id="montecarlo" title="Monte Carlo Method">
          <p>
            A Monte Carlo simulation runs thousands of independent scenarios, each representing one possible
            version of your financial future. Rather than asking "what happens if markets return 7% every year,"
            it asks "across all the ways markets could behave, how often do you succeed?"
          </p>
          <Sub title="How each path is generated">
            <p>For each of the {inputs.numSimulations.toLocaleString()} simulations:</p>
            <ol className="list-decimal pl-5 grid gap-1">
              <li>Start with your current investable assets today.</li>
              <li>For each year from your current age to your planning age:</li>
              <li className="pl-2">Draw a random market return from a log-normal distribution calibrated to your expected return and volatility inputs.</li>
              <li className="pl-2">Apply that return to the portfolio.</li>
              <li className="pl-2">Add income (salary, Social Security, carry, other retirement income) net of taxes.</li>
              <li className="pl-2">Subtract spending (if retired), mortgage payments, capital call obligations, and college costs.</li>
              <li className="pl-2">Apply tax on portfolio withdrawals (retirement phase only).</li>
              <li>Record the portfolio value. If it hits zero in retirement, mark the path as ruined.</li>
            </ol>
            <p>After all paths, tally up outcomes to produce percentiles, success rates, and band probabilities.</p>
          </Sub>
          <Callout>
            The ordering matters. Return is applied first, then cash flows. This correctly models
            sequence-of-returns risk: a bad year early in retirement is more damaging than a bad year late,
            because it reduces the base that future gains compound on.
          </Callout>
        </Section>

        {/* -- RETURN MODEL -- */}
        <Section id="returns" title="Return Model">
          <Sub title="Log-normal returns">
            <p>
              Annual returns are drawn from a log-normal distribution. This means the log of (1 + return)
              is normally distributed -- producing the realistic property that returns cannot go below -100%
              and have a positive skew (large gains are possible but large losses are bounded).
            </p>
            <Formula>Return_t = (1 + CAGR) * exp(volatility * Z) - 1, where Z ~ N(0, 1)</Formula>
            <p>
              The geometric mean (CAGR) of this distribution is exactly your expected return input.
              This is what most people intend: if you type 7%, the median compounded outcome over many years
              grows at exactly 7% per year.
            </p>
          </Sub>
          <Sub title="Expected Return input">
            <p>
              Your current expected return is {formatPercentage(inputs.expectedReturn, 1)}. This is the geometric mean annual
              return -- the CAGR, not the arithmetic mean. The arithmetic mean (simple average) will be somewhat
              higher due to volatility: approximately {formatPercentage(inputs.expectedReturn + 0.5 * inputs.volatility ** 2, 1)} given
              your current volatility of {formatPercentage(inputs.volatility, 0)}.
            </p>
          </Sub>
          <Sub title="Volatility input">
            <p>
              Volatility ({formatPercentage(inputs.volatility, 0)} currently) represents the annualized standard deviation of log-returns.
              Higher volatility produces wider outcome distributions -- the fan chart bands spread further.
              A 100% equity portfolio typically has volatility around 15-18%. A balanced portfolio might be 8-12%.
            </p>
          </Sub>
          <Callout>
            The model uses independent and identically distributed (IID) returns each year. Real markets
            exhibit volatility clustering and serial correlation. See Limitations for what this means for
            tail risk estimates.
          </Callout>
        </Section>

        {/* -- ASSETS -- */}
        <Section id="assets" title="Your Assets">
          <p>
            Assets are split into five buckets, each treated differently for liquidity and tax purposes.
            Only the investable buckets (all except Illiquid) enter the simulation as the starting wealth pool.
          </p>
          <Sub title="Taxable Brokerage">
            <p>
              Standard brokerage accounts. Gains are assumed to be long-held positions, taxed at LTCG rates
              (20% federal + 3.8% NIIT + your state rate) when withdrawn in retirement. During accumulation,
              the after-tax savings rate flows here and into other taxable accounts.
            </p>
          </Sub>
          <Sub title="Traditional 401k / IRA (Tax-Deferred)">
            <p>
              Pre-tax contributions reduce taxable income today. Withdrawals in retirement are taxed as
              ordinary income at an assumed 22% federal rate plus your state rate. Your pre-tax savings rate
              input directly controls how much flows here each working year.
            </p>
          </Sub>
          <Sub title="Roth 401k / IRA (Tax-Free)">
            <p>
              After-tax contributions, tax-free growth, and tax-free withdrawals. The model treats draws
              from this bucket as zero-tax. The asset mix fraction of tax-deferred vs. taxable vs. tax-free
              is fixed at today's ratio throughout the simulation.
            </p>
          </Sub>
          <Sub title="Illiquid Assets (incl. Home)">
            <p>
              Real estate equity, PE fund interests, and other illiquid holdings. These are excluded from
              the investable portfolio -- the simulation does not assume you can sell them to fund spending.
              They appear in net worth calculations but do not provide liquidity.
            </p>
          </Sub>
          <Sub title="Cash Reserves">
            <p>
              Liquid cash and money market funds. Included in the investable pool. Earns the same return
              as the portfolio (a simplification -- in practice, cash earns less, but the difference is small
              relative to total portfolio size).
            </p>
          </Sub>
          <Callout>
            The model uses a fixed starting asset mix ratio to determine the tax character of future
            portfolio withdrawals. It does not model Roth conversion strategies or asset location optimization.
          </Callout>
        </Section>

        {/* -- TAXES -- */}
        <Section id="taxes" title="Tax Model">
          <p>
            The tax engine uses 2025 federal brackets and attempts to model the full tax picture in both
            the accumulation phase (working years) and the distribution phase (retirement).
          </p>
          <Sub title="Working years -- income tax">
            <p>
              During accumulation, the model computes taxes on your combined household gross income using
              the 2025 federal brackets (MFJ or Single depending on your filing status), the standard
              deduction ({inputs.filingStatus === 'mfj' ? '$30,000' : '$15,000'}), child tax credits
              ($2,000/child, phasing out above {inputs.filingStatus === 'mfj' ? '$400K' : '$200K'} AGI),
              FICA (SS: 6.2% up to $176,100; Medicare: 1.45% + 0.9% above threshold), and your state
              income tax rate ({formatPercentage(inputs.stateIncomeTaxRate, 1)}).
            </p>
          </Sub>
          <Sub title="Pre-tax savings (401k etc.)">
            <p>
              Your pre-tax savings rate ({formatPercentage(inputs.preTaxSavingsRate, 0)} currently) reduces taxable income
              before bracket calculation. The actual dollar amount goes directly into the wealth pool as
              tax-deferred savings. The after-tax savings rate is applied to the true take-home after both
              pre-tax contributions and taxes are deducted.
            </p>
            <Formula>
              True take-home = Gross - Pre-tax contributions - Taxes(Gross - Pre-tax contributions)
              After-tax saved = True take-home * after-tax savings rate
            </Formula>
          </Sub>
          <Sub title="Retirement years -- income from SS and other sources">
            <p>
              In retirement, income from Social Security, pensions, and other retirement income is taxed
              through the same bracket engine (without FICA, and without pre-tax deductions). This after-tax
              income supplements the portfolio and reduces the net draw.
            </p>
          </Sub>
          <Sub title="Retirement years -- portfolio withdrawal tax">
            <p>
              When spending exceeds income from SS and other sources, the shortfall is a portfolio draw.
              That draw is taxed based on the asset mix:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>Traditional IRA/401k fraction: taxed at 22% federal + {formatPercentage(inputs.stateIncomeTaxRate, 1)} state</li>
              <li>Taxable brokerage fraction: taxed at 20% + 3.8% NIIT (LTCG treatment)</li>
              <li>Roth fraction: zero tax</li>
            </ul>
          </Sub>
          <Callout>
            The retirement withdrawal tax rate is a blended estimate, not an exact calculation. It does not
            model RMDs, Roth conversions, tax-loss harvesting, or QCD strategies. For high-balance
            tax-deferred accounts, the actual marginal rate on large distributions could be higher than 22%.
          </Callout>
        </Section>

        {/* -- SOCIAL SECURITY -- */}
        <Section id="socialsecurity" title="Social Security"> 
          <Sub title="Claiming age factors">
            <p>
              The Full Retirement Age (FRA) for those born in 1960 or later is 67. Benefits adjust as follows:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>Claim at 62: benefit reduced ~30% (6.67%/year for first 3 years before FRA, 5%/year thereafter)</li>
              <li>Claim at FRA (67): full benefit</li>
              <li>Delay to 70: benefit increased 8% per year past FRA, capping at +24%</li>
            </ul>
            <p>Your current claiming age: {inputs.socialSecurityAge}. Claiming factor: approximately {
              inputs.socialSecurityAge <= 62 ? "70%" :
              inputs.socialSecurityAge >= 70 ? "124%" :
              inputs.socialSecurityAge < 67 ?
                formatPercentage(1 - Math.min(3, 67 - inputs.socialSecurityAge) * 0.0667 - Math.max(0, 67 - inputs.socialSecurityAge - 3) * 0.05, 0) :
                formatPercentage(1 + (inputs.socialSecurityAge - 67) * 0.08, 0)
            }</p>
          </Sub>
          <Sub title="SS trust fund haircut">
            <p>
              The Social Security trust fund is projected to be depleted around 2033-2035, at which point
              payroll taxes alone would fund approximately 79-83% of scheduled benefits. The model applies
              a 15% haircut to all SS income as a conservative base case. This is not a prediction — it is
              a planning assumption that can be stress-tested.
            </p>
          </Sub>
          <Sub title="COLA adjustments">
            <p>
              SS benefits are inflation-adjusted using your inflation rate input ({formatPercentage(inputs.inflationRate, 1)})
              from the claiming age forward. In reality, SS uses CPI-W, which may differ from your
              personal inflation experience.
            </p>
          </Sub>
        </Section>

        {/* -- SPENDING -- */}
        <Section id="spending" title="Spending Model">
          <p>
            The spending smile reflects empirical research showing that retirees typically spend most
            in early "go-go" retirement when they are healthy and active, taper in middle "slow-go" years,
            then see costs rise again in late "no-go" years due to healthcare.
          </p>
          <Sub title="Three phases">
            <ul className="list-disc pl-5 grid gap-1">
              <li>Go-Go ({inputs.goGoYears} years): {formatCompactCurrency(inputs.spendingGoGo)}/yr — active travel, lifestyle</li>
              <li>Slow-Go ({inputs.slowGoYears} years): {formatCompactCurrency(inputs.spendingSlowGo)}/yr — reduced activity</li>
              <li>No-Go (late retirement): {formatCompactCurrency(inputs.spendingNoGo)}/yr base + {formatCompactCurrency(inputs.healthcareSurgeAmount)} healthcare surge</li>
            </ul>
          </Sub>
          <Sub title="Sustainable spend calculation">
            <p>
              The "safe sustainable spend" headline is solved via binary search: it finds the go-go
              spending level where your success rate equals exactly 85%.
            </p>
          </Sub>
        </Section>

        {/* -- CARRY AWARDS -- */}
        <Section id="carry" title="Carry Awards">
          <p>
            Carried interest (carry) is modeled as a structured cash flow following a standard PE fund
            distribution curve. GP commit outflows are modeled as capital calls in the early years.
          </p>
          <Sub title="Distribution curve">
            <p>Distributions as % of award value by fund year:</p>
            <div className="grid grid-cols-6 gap-1 mt-1">
              {CARRY_DISTRIBUTION_CURVE.map((pct, i) => (
                <div key={i} className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-1 text-center">
                  <p className="text-[10px] font-bold text-[var(--accent)]">{pct > 0 ? `${(pct * 100).toFixed(1)}%` : "—"}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">Yr {i + 1}</p>
                </div>
              ))}
            </div>
          </Sub>
        </Section>

        {/* -- COLLEGE -- */}
        <Section id="college" title="College Costs">
          <Sub title="529 savings offset">
            <p>
              Your 529 balance is divided evenly across all college years and applied as an annual offset.
            </p>
            <Formula>
              Annual portfolio draw = max(0, inflated_annual_cost - (529_balance / years))
            </Formula>
          </Sub>
        </Section>

        {/* -- LIABILITIES -- */}
        <Section id="liabilities" title="Liabilities">
          <Sub title="Mortgage">
            <p>
              Annual mortgage payments are deducted from the portfolio for the number of years remaining
              specified. Payments are fixed in nominal dollars.
            </p>
          </Sub>
        </Section>

        {/* -- CHARTS -- */}
        <Section id="charts" title="Reading the Charts">
          <Sub title="Rich / Broke / Dead">
            <p>
              A stacked area chart showing outcome probabilities. The bands represent portfolio value relative to your
              inflation-adjusted starting assets.
            </p>
          </Sub>
        </Section>

        {/* -- METRICS -- */}
        <Section id="metrics" title="Key Metrics">
          <Sub title="Success Rate">
            <p>
              The fraction of simulated paths that never depleted the portfolio during retirement.
            </p>
          </Sub>
        </Section>

        {/* -- LIMITATIONS -- */}
        <Section id="limitations" title="Known Limitations">
          <Sub title="IID log-normal returns">
            <p>
              Real markets exhibit volatility clustering and fat tails. The IID model may understate tail risk.
            </p>
          </Sub>
          <Sub title="Retirement withdrawal tax">
            <p>
              Withdrawal taxes are estimated based on your current asset mix and simplified tax rates.
              RMDs and Roth conversion strategies are not modeled.
            </p>
          </Sub>
          <Callout>
            Terminus is a planning and exploration tool, not financial advice. Projections are probabilistic.
            Consult with a qualified financial advisor.
          </Callout>
        </Section>

      </div>
    </div>
  );
}
import { ReactNode } from "react";
import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { CARRY_DISTRIBUTION_CURVE } from "../../lib/constants";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="grid gap-3 scroll-mt-16">
      <h2 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
        {title}
      </h2>
      <div className="grid gap-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</p>
      <div className="pl-3 border-l-2 border-[var(--border)] grid gap-1.5 text-xs text-[var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-3 py-2.5 text-xs text-[var(--text-secondary)]">
      {children}
    </div>
  );
}

function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--warning)]/25 bg-[var(--warning)]/5 px-3 py-2.5 text-xs text-[var(--text-secondary)]">
      {children}
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-[11px] text-[var(--accent)] whitespace-pre-wrap">
      {children}
    </div>
  );
}

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "montecarlo", label: "Monte Carlo" },
  { id: "returns", label: "Return Model" },
  { id: "assets", label: "Asset Buckets" },
  { id: "taxes", label: "Tax Model" },
  { id: "socialsecurity", label: "Social Security" },
  { id: "spending", label: "Spending Model" },
  { id: "carry", label: "Carry Awards" },
  { id: "college", label: "College Costs" },
  { id: "liabilities", label: "Liabilities" },
  { id: "charts", label: "Reading the Charts" },
  { id: "metrics", label: "Key Metrics" },
  { id: "limitations", label: "Limitations" },
];

export function InfoPage() {
  const inputs = useSimStore((state) => state.inputs);

  const ssFactor = inputs.socialSecurityAge <= 62 ? 0.70
    : inputs.socialSecurityAge >= 70 ? 1.24
    : inputs.socialSecurityAge < 67
      ? 1 - Math.min(3, 67 - inputs.socialSecurityAge) * 0.0667 - Math.max(0, 67 - inputs.socialSecurityAge - 3) * 0.05
      : 1 + (inputs.socialSecurityAge - 67) * 0.08;

  return (
    <div className="grid lg:grid-cols-[180px_minmax(0,1fr)] gap-6">

      <nav className="hidden lg:block">
        <div className="sticky top-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Contents</p>
          <ul className="grid gap-0.5">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors py-0.5 pl-2 border-l border-transparent hover:border-[var(--accent)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="grid gap-10 max-w-2xl">

        <Section id="overview" title="What is Terminus?">
          <p>
            Terminus is a Monte Carlo retirement simulator built for high-income professionals
            with complex financial situations: PE carry awards, multiple asset buckets,
            tax-deferred and taxable accounts, capital call obligations, Social Security, and
            multi-phase retirement spending.
          </p>
          <p>
            It models {inputs.numSimulations.toLocaleString()} complete lifetime scenarios simultaneously.
            Every slider adjustment re-runs the full simulation within 400ms and updates all
            charts live. The goal is not a single forecast — it is a probability distribution
            across all the ways your financial future could unfold.
          </p>
          <Callout>
            Terminus is a planning and exploration tool, not financial advice.
            All projections are probabilistic estimates. Consult a fee-only financial
            planner and CPA for personalized guidance.
          </Callout>
        </Section>

        <Section id="montecarlo" title="Monte Carlo Method">
          <p>
            A Monte Carlo simulation runs thousands of independent scenarios rather than
            projecting a single average outcome. Instead of asking "what happens if markets
            return 7% every year," it asks "across all the ways markets could behave over
            the next 45 years, how often do you run out of money?"
          </p>
          <Sub title="How each simulated path is constructed">
            <p>For each of the {inputs.numSimulations.toLocaleString()} simulations, the engine:</p>
            <ol className="list-decimal pl-5 grid gap-1">
              <li>Starts with your current investable assets (taxable + deferred + Roth + cash).</li>
              <li>Steps through every year from your current age to your planning age.</li>
              <li>Draws a random market return from a log-normal distribution (see Return Model).</li>
              <li>Applies that return to the portfolio balance.</li>
              <li>Adds after-tax income: salary (during accumulation), Social Security, carry
                  distributions, and other retirement income.</li>
              <li>Subtracts spending (in retirement), mortgage payments, capital call
                  obligations, college costs, and GP commit outflows.</li>
              <li>Applies estimated tax on portfolio withdrawals in retirement.</li>
              <li>Record the portfolio value for that year. If it hits zero during retirement,
                  the path is marked as ruined.</li>
            </ol>
            <p>
              After all paths complete, the engine tallies outcomes: percentile wealth values
              at each age, probability of ruin, band classifications, and terminal wealth
              at your planning age.
            </p>
          </Sub>
          <Sub title="Why order matters: sequence of returns risk">
            <p>
              Return is applied before cash flows — not after. This is not an accident.
              It correctly models sequence-of-returns risk: a 40% market decline in year
              one of retirement is catastrophically more damaging than the same decline
              in year 20, because it depletes the base that future gains compound on.
              If withdrawals were applied before returns, this risk would be understated.
            </p>
          </Sub>
          <Sub title="What 85% success rate means">
            <p>
              A success rate of 85% means that in 850 of your {inputs.numSimulations.toLocaleString()} simulated futures,
              your portfolio never reached zero during retirement. In the other 150 paths,
              it depleted — sometimes at age 72, sometimes at age 88. The distribution of
              those failure ages is visible in the Rich/Broke/Dead chart.
            </p>
          </Sub>
          <Callout>
            A 100% success rate is not the goal. It typically requires spending so far
            below your means that you die with enormous unspent wealth. Most financial
            planners target 85-90% as the appropriate confidence level — high enough to
            be comfortable, low enough to allow meaningful spending in retirement.
          </Callout>
        </Section>

        <Section id="returns" title="Return Model">
          <Sub title="Log-normal distribution">
            <p>
              Annual returns are drawn from a log-normal distribution. This means
              ln(1 + return) is normally distributed. The practical implications:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>Returns cannot go below -100% (portfolio cannot go negative from returns alone).</li>
              <li>The distribution has a positive skew: occasional very large gains are possible.</li>
              <li>Losses are bounded; gains are theoretically unbounded.</li>
            </ul>
            <Formula>Return = (1 + CAGR) x exp(volatility x Z) - 1{"\n"}where Z is drawn from a standard normal distribution N(0,1)</Formula>
          </Sub>
          <Sub title="Expected return input — what it actually means">
            <p>
              Your expected return input ({formatPercentage(inputs.expectedReturn, 1)}) is the
              geometric mean — the CAGR. If you simulate one million paths with this formula,
              the median compounded outcome grows at exactly {formatPercentage(inputs.expectedReturn, 1)} per year.
            </p>
            <p>
              The arithmetic mean (simple average of year-by-year returns) will be higher:
              approximately {formatPercentage(inputs.expectedReturn + 0.5 * inputs.volatility ** 2, 2)} given your
              current volatility of {formatPercentage(inputs.volatility, 0)}. The difference is
              (0.5 x sigma squared), known as the variance drag. This is a real cost of
              volatility that many people underestimate.
            </p>
          </Sub>
          <Sub title="Volatility input">
            <p>
              Volatility ({formatPercentage(inputs.volatility, 0)} currently) is the annualized
              standard deviation of log-returns. It controls how wide the fan chart bands spread.
              Historical reference points:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>100% US equities (S&P 500): approximately 15-18% volatility</li>
              <li>60/40 equity/bond portfolio: approximately 10-12%</li>
              <li>Conservative balanced portfolio: approximately 6-9%</li>
              <li>Cash-heavy/conservative: approximately 3-5%</li>
            </ul>
            <p>
              Higher volatility increases the range of outcomes without changing the median.
              The 10th percentile gets worse; the 90th percentile gets better.
              This asymmetry is why volatility hurts retirement portfolios even with the same
              average return.
            </p>
          </Sub>
          <Sub title="Independent and identically distributed (IID) returns">
            <p>
              Each year's return is drawn independently, with no memory of prior years.
              In the model, a terrible year is no more or less likely to be followed by
              a good year than a normal year would be. See Limitations for what this
              assumption misses.
            </p>
          </Sub>
        </Section>

        <Section id="assets" title="Asset Buckets">
          <p>
            Assets are split into five buckets. Only the four investable buckets enter the
            simulation. Illiquid assets are excluded from the wealth pool — the model never
            assumes you sell your house or PE interests to fund spending.
          </p>
          <Sub title="Taxable brokerage">
            <p>
              Standard brokerage and investment accounts holding stocks, ETFs, and bonds.
              The simulation treats all withdrawals from this bucket as long-held positions
              taxed at LTCG rates: 20% federal + 3.8% NIIT + your state rate.
              During accumulation, your after-tax savings flow here (and into other taxable vehicles).
            </p>
          </Sub>
          <Sub title="Traditional 401k / IRA (tax-deferred)">
            <p>
              Pre-tax contributions that reduced your taxable income when made. All growth
              is tax-deferred. Withdrawals in retirement are 100% ordinary income.
              The model taxes distributions at 22% federal + your state income tax rate as
              a blended estimate. Your pre-tax savings rate input controls annual contributions
              during working years — these reduce your taxable income in the simulation's tax
              calculation and flow directly into the wealth pool.
            </p>
          </Sub>
          <Sub title="Roth 401k / IRA (tax-free)">
            <p>
              After-tax contributions with tax-free growth and tax-free withdrawals.
              The simulation treats all draws from this bucket as zero-tax.
              The fraction of your portfolio in each bucket is fixed at today's ratio
              throughout the simulation — the model does not glide-path your allocations
              or model Roth conversion strategies.
            </p>
          </Sub>
          <Sub title="Illiquid assets (including home)">
            <p>
              Real estate equity, PE fund NAV, syndication interests, private company stakes,
              and other assets that cannot be quickly liquidated. These appear in net worth
              calculations in the sidebar but are excluded from the investable pool. The
              simulation will not sell them to fund spending shortfalls.
            </p>
            <p>
              Important: the model does not update illiquid asset values over time. As you
              pay down your mortgage, your home equity grows — but that growth is not
              reflected in the simulation. Consider adding expected proceeds from illiquid
              asset sales as carry-award-style events in the Carry Awards section.
            </p>
          </Sub>
          <Sub title="Cash reserves">
            <p>
              Liquid cash, money market funds, and short-term equivalents.
              Included in the investable pool. The simulation applies the same portfolio
              return to cash as to equities — a simplification that slightly overstates
              cash returns in low-rate environments, but the effect is small relative
              to total portfolio size.
            </p>
          </Sub>
          <Callout>
            The starting asset mix ratio (deferred / taxable / Roth / cash) is used as
            a permanent proxy for withdrawal tax character throughout the simulation.
            It does not shift over time. If you plan to substantially change your
            allocation before retirement (e.g., via Roth conversions), adjust your
            inputs to reflect the expected mix at retirement.
          </Callout>
        </Section>

        <Section id="taxes" title="Tax Model">
          <p>
            The tax engine uses 2025 federal brackets for both the accumulation and
            distribution phases. It models federal income tax, FICA, state income tax,
            child tax credits, and portfolio withdrawal taxes. It does not model AMT,
            capital gains harvesting, QOZ investments, or RMDs.
          </p>
          <Sub title="Working years: income tax on salary">
            <p>
              Each working year, the engine taxes your combined household gross income
              using 2025 brackets for your filing status
              ({inputs.filingStatus === 'mfj' ? 'Married Filing Jointly' : 'Single'}).
              Deductions and adjustments applied:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>Pre-tax savings ({formatPercentage(inputs.preTaxSavingsRate, 0)} of gross) reduce taxable income before brackets</li>
              <li>Standard deduction ({inputs.filingStatus === 'mfj' ? '$30,000' : '$15,000'} for 2025)</li>
              <li>Child tax credit ($2,000 per dependent, phases out above {inputs.filingStatus === 'mfj' ? '$400K' : '$200K'} AGI)</li>
              <li>FICA: SS 6.2% up to $176,100 wage base + Medicare 1.45% + 0.9% above {inputs.filingStatus === 'mfj' ? '$250K' : '$200K'}</li>
              <li>State income tax ({formatPercentage(inputs.stateIncomeTaxRate, 1)}) on taxable income</li>
            </ul>
          </Sub>
          <Sub title="Pre-tax savings mechanics">
            <p>
              The pre-tax savings amount (401k, HSA, etc.) flows directly into the wealth
              pool as tax-deferred savings while reducing taxable income. The after-tax savings
              rate is applied to your true take-home, which is calculated as:
            </p>
            <Formula>True take-home = Gross - Pre-tax contributions - All taxes{"\n"}After-tax saved = True take-home x after-tax savings rate</Formula>
            <p>
              This prevents double-counting: the pre-tax 401k contribution is not also
              counted as available for after-tax investment.
            </p>
          </Sub>
          <Sub title="Retirement years: income from Social Security and pensions">
            <p>
              In retirement, income from SS, pensions, and other retirement sources is
              processed through the same tax engine (FICA is waived; pre-tax deductions
              do not apply). The after-tax income supplements the portfolio, reducing the
              net draw needed to cover spending.
            </p>
          </Sub>
          <Sub title="Retirement years: portfolio withdrawal tax">
            <p>
              When annual spending exceeds income from SS and other sources, the gap is
              funded by portfolio withdrawals. The model estimates tax on those withdrawals
              based on your starting asset mix:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>Tax-deferred fraction: 22% federal + {formatPercentage(inputs.stateIncomeTaxRate, 1)} state (ordinary income)</li>
              <li>Taxable brokerage fraction: 20% federal + 3.8% NIIT (LTCG treatment)</li>
              <li>Roth fraction: 0% tax</li>
            </ul>
            <p>
              Example with your current inputs: if you need to draw $100K from the
              portfolio in retirement, approximately
              {' '}{formatCompactCurrency(inputs.taxDeferredAssets / Math.max(1, inputs.taxableAssets + inputs.taxDeferredAssets + inputs.taxFreeAssets + inputs.cashReserves) * 100 * (0.22 + inputs.stateIncomeTaxRate))}K
              in taxes would be owed on the tax-deferred portion alone.
            </p>
          </Sub>
          <Warn>
            The 22% federal ordinary rate on deferred withdrawals is a planning estimate.
            Once stacked with Social Security income (up to 85% of which is taxable),
            large traditional IRA balances can push distributions into the 24-32% bracket.
            After age 73, RMDs impose mandatory withdrawal minimums that can dramatically
            increase taxable income regardless of spending needs. This model does not
            yet simulate RMDs.
          </Warn>
        </Section>

        <Section id="socialsecurity" title="Social Security">
          <Sub title="Full Retirement Age and claiming strategy">
            <p>
              The Full Retirement Age (FRA) for anyone born in 1960 or later is age 67.
              Your current claiming age is {inputs.socialSecurityAge}, which applies a factor
              of approximately {formatPercentage(ssFactor, 0)} to your stated benefit:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li>Claim at 62: -30% (6.67%/year for first 3 years early, 5%/year beyond)</li>
              <li>Claim at 64: approximately -20%</li>
              <li>Claim at 67 (FRA): 100% of your benefit</li>
              <li>Claim at 68: +8% — delayed credits accumulate at 8%/year past FRA</li>
              <li>Claim at 70: +24% — maximum benefit, no further credits after 70</li>
            </ul>
            <p>
              Delaying from 62 to 70 increases your monthly benefit by approximately
              77%. For someone with longevity in the family and other income to bridge
              the gap, delaying typically maximizes lifetime SS income.
            </p>
          </Sub>
          <Sub title="SS trust fund haircut">
            <p>
              The Social Security trust fund is projected to face depletion around
              2033-2035 under current law, at which point scheduled benefits would
              be automatically cut to approximately 79-83% of the statutory amount.
              The model applies a 15% haircut to all SS income as a conservative
              planning assumption. This is not a prediction — Congress has always
              intervened before depletion in the past. You can test the no-haircut
              scenario by setting your SS benefit 17.6% higher than the SSA estimate
              (which reverses the haircut).
            </p>
          </Sub>
          <Sub title="Cost of living adjustments (COLA)">
            <p>
              Social Security benefits are indexed to inflation via annual COLA
              adjustments. The model inflates your SS income each year using your
              inflation rate input ({formatPercentage(inputs.inflationRate, 1)}) starting
              from your claiming age. In reality, SS uses the CPI-W index, which
              may diverge from your personal inflation experience (particularly if
              healthcare costs are a large share of your spending).
            </p>
          </Sub>
        </Section>

        <Section id="spending" title="Spending Model">
          <p>
            The spending smile reflects empirical research on actual retiree spending
            patterns. Spending is highest in early "go-go" years when retirees are
            healthy and active, tapers in middle "slow-go" years as activity declines,
            then rises again in "no-go" years due to healthcare and long-term care costs.
          </p>
          <Sub title="Three-phase structure">
            <ul className="list-disc pl-5 grid gap-1">
              <li>
                <strong>Go-Go</strong> ({inputs.goGoYears} years, ages {inputs.retirementAge}–{inputs.retirementAge + inputs.goGoYears - 1}):
                {' '}{formatCompactCurrency(inputs.spendingGoGo)}/yr — active retirement, travel, lifestyle maintenance.
                This is typically the highest-spend phase.
              </li>
              <li>
                <strong>Slow-Go</strong> ({inputs.slowGoYears} years, ages {inputs.retirementAge + inputs.goGoYears}–{inputs.retirementAge + inputs.goGoYears + inputs.slowGoYears - 1}):
                {' '}{formatCompactCurrency(inputs.spendingSlowGo)}/yr — reduced activity, same fixed costs, less discretionary.
              </li>
              <li>
                <strong>No-Go</strong> (age {inputs.retirementAge + inputs.goGoYears + inputs.slowGoYears}+):
                {' '}{formatCompactCurrency(inputs.spendingNoGo)}/yr base + {formatCompactCurrency(inputs.healthcareSurgeAmount)}/yr healthcare surge.
                Healthcare and potential long-term care costs dominate.
              </li>
            </ul>
          </Sub>
          <Sub title="Inflation adjustment">
            <p>
              All spending inputs are in today's dollars. Each year of retirement,
              spending is inflated by your inflation rate ({formatPercentage(inputs.inflationRate, 1)})
              compounded from retirement. At {formatPercentage(inputs.inflationRate, 1)} inflation,
              purchasing power halves in approximately {Math.round(72 / (inputs.inflationRate * 100))} years.
              Your go-go spending of {formatCompactCurrency(inputs.spendingGoGo)}/yr today
              will require approximately {formatCompactCurrency(inputs.spendingGoGo * Math.pow(1 + inputs.inflationRate, inputs.retirementAge - inputs.currentAge))}/yr
              in nominal terms at retirement in {inputs.retirementAge - inputs.currentAge} years.
            </p>
          </Sub>
          <Sub title="Sustainable spend solver">
            <p>
              The "safe sustainable spend at 85%" headline is computed by a 10-step
              binary search. It finds the go-go spending level at which exactly 85%
              of simulated paths succeed. Each step runs 2 batches of 400 paths and
              averages the success rates to reduce noise. Slow-go spending is set at
              75% of go-go; no-go at 60%, preserving the smile shape throughout the search.
            </p>
          </Sub>
          <Sub title="Smart spending suggestion">
            <p>
              The "Apply" button in the spending section sets spending based on the
              lower of two methods: (A) 65% income replacement of your current
              after-tax income, and (B) 4.5% of your investable assets. This is a
              starting point, not a recommendation — your actual spending in retirement
              may be higher or lower depending on your lifestyle, health, and goals.
            </p>
          </Sub>
        </Section>

        <Section id="carry" title="Carry Awards">
          <p>
            Carried interest is the share of investment profits paid to fund managers
            after returning capital and meeting a preferred return hurdle. It is modeled
            as a structured cash flow following a standard PE fund distribution curve,
            with GP commit outflows in the early years.
          </p>
          <Sub title="Input definitions">
            <ul className="list-disc pl-5 grid gap-1">
              <li>
                <strong>Your Award Value</strong>: the total expected lifetime value of your
                personal carry allocation. This is your number after fund-level allocation —
                not the total fund pool.
              </li>
              <li>
                <strong>Pool Value Capture %</strong>: a conservatism discount you apply.
                If you expect the fund to perform at 75% of its underwriting case, set this
                to 75%. If you are highly confident in the case, set it to 90-100%.
              </li>
              <li>
                <strong>Vested %</strong>: the fraction of the award you would receive if
                you left your firm today. Typical vesting is straight-line over 12 quarters
                (3 years) from the award vintage date. Set this to reflect your current
                vesting status if you are modeling a departure scenario.
              </li>
              <li>
                <strong>GP Commit %</strong>: the percentage of your award value you must
                co-invest alongside the fund as a general partner commitment. Typical GP
                commit is 1-2% of total fund size; as a percentage of your carry award
                it is often 8-15%.
              </li>
            </ul>
          </Sub>
          <Sub title="Distribution curve">
            <p>
              Each year's distribution is calculated as: Award Value x Capture % x Vested %
              x curve percentage for that fund year. The curve sums to 100%:
            </p>
            <div className="grid grid-cols-6 gap-1 mt-1">
              {CARRY_DISTRIBUTION_CURVE.map((pct, i) => (
                <div key={i} className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-1 text-center">
                  <p className="text-[10px] font-bold text-[var(--accent)]">
                    {pct > 0 ? `${(pct * 100).toFixed(1)}%` : "--"}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)]">Yr {i + 1}</p>
                </div>
              ))}
            </div>
            <p className="mt-1">
              Fund Years 1-2: no distributions (capital deployment phase). Year 3: first
              distributions begin at 5%. Years 7-9: peak distribution years at 15% each.
              Year 12: final distributions at 2.5%. This curve represents a typical
              buyout fund — growth equity and venture funds often have different timing.
            </p>
          </Sub>
          <Sub title="GP commit schedule">
            <p>
              GP commit = Award Value x GP Commit %. This total is called straight-line
              over the first 3 fund years (1/3 per year from the vintage year).
              The annual outflow deducts from the investable portfolio.
              For a $1M award with 12% GP commit: $120K total called as $40K/year for
              3 years starting in the vintage year.
            </p>
          </Sub>
          <Sub title="Tax treatment">
            <p>
              Carry distributions are taxed as long-term capital gains. The effective
              rate with your current state tax rate ({formatPercentage(inputs.stateIncomeTaxRate, 1)}) is:
              20% federal LTCG + 3.8% NIIT + {formatPercentage(inputs.stateIncomeTaxRate, 1)} state
              = {formatPercentage(Math.min(0.20 + 0.038 + inputs.stateIncomeTaxRate, 0.55), 1)} effective rate
              (capped at 55%). GP commit outflows are not modeled as tax-deductible.
            </p>
          </Sub>
          <Callout>
            The 12-year distribution curve is a stylized approximation. Actual fund
            timing depends on exit environment, portfolio company performance, and fund
            manager decisions. For funds with known actual distributions, adjust the
            Pool Value Capture % to reflect realized vs. expected performance, or model
            realized proceeds as a known amount.
          </Callout>
        </Section>

        <Section id="college" title="College Costs">
          <Sub title="How college events are modeled">
            <p>
              Each child is modeled as an annual portfolio withdrawal for the specified
              number of years, beginning when the parent reaches the specified age.
              The annual cost is inflated by your inflation rate from today.
            </p>
          </Sub>
          <Sub title="529 savings offset">
            <p>
              Your 529 balance is amortized evenly across all college years and applied
              as an annual cost offset. This corrects a common modeling error where the
              entire 529 balance offsets only the first year.
            </p>
            <Formula>Annual net draw = max(0, inflated_cost - (529_balance / num_years))</Formula>
            <p>
              Example: $180K in a 529, $95K annual cost, 4 years. Annual offset = $45K.
              Net annual draw = $95K - $45K = $50K (inflated each year). Total net draw
              over 4 years = approximately $210K, vs. $285K if 529 were not offset.
            </p>
          </Sub>
          <Sub title="College start age">
            <p>
              The "Start Age" field is your age (not your child's) when college begins.
              A 47-year-old with a child starting college when the parent is 65 would
              set Start Age to 65. This ensures the cost deduction happens at the
              right point in the simulation timeline.
            </p>
          </Sub>
        </Section>

        <Section id="liabilities" title="Liabilities and Obligations">
          <Sub title="Mortgage">
            <p>
              Annual mortgage payments are deducted from the portfolio for the number
              of years remaining you specify, regardless of retirement status. Payments
              are fixed in nominal dollars — they are not inflation-adjusted (which is
              correct, as your actual mortgage payment is fixed).
            </p>
            <p>
              Note: the model does not increase your illiquid asset value as the mortgage
              is paid down. Your net worth display in the sidebar subtracts the current
              mortgage balance, but the simulation does not credit home equity growth
              year-by-year. This means net worth accumulation during the mortgage
              paydown period is modestly understated.
            </p>
          </Sub>
          <Sub title="Annual capital call obligations">
            <p>
              A fixed annual outflow representing ongoing PE fund co-investment
              commitments outside of specific carry awards — for example, a fund-of-funds
              commitment, secondaries vehicle, or recurring co-invest obligation.
              This fires every year until retirement age. It does not automatically
              stop at a specific fund's investment period end. If your obligation ends
              before retirement, set it to zero or model it as a carry award instead.
            </p>
          </Sub>
          <Sub title="Carry award GP commits">
            <p>
              GP commits for specific carry awards are modeled separately in the Carry
              Awards section and apply for 3 years from the vintage date, independent
              of retirement age. A carry award that began in 2024 will continue calling
              GP commits through 2026 even if you retire in 2025.
            </p>
          </Sub>
        </Section>

        <Section id="charts" title="Reading the Charts">
          <Sub title="Rich / Broke / Dead">
            <p>
              A stacked area chart showing the probability distribution of outcomes at
              each age from retirement to your planning age. Every vertical slice sums
              to 100%. The bands represent portfolio value relative to your
              inflation-adjusted starting investable assets at that age:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li><strong>Broke</strong>: portfolio has reached $0 at some point in retirement</li>
              <li><strong>Struggling</strong>: portfolio balance below 50% of inflation-adjusted starting assets</li>
              <li><strong>Surviving</strong>: 50-100% of inflation-adjusted starting assets</li>
              <li><strong>Thriving</strong>: 100-200% of inflation-adjusted starting assets</li>
              <li><strong>Flourishing</strong>: more than 200% of inflation-adjusted starting assets</li>
              <li><strong>Dead</strong>: actuarial probability of having died, from SSA mortality tables</li>
            </ul>
            <p>
              The Dead band is derived from SSA period life tables. It grows monotonically
              — by age 80, approximately 35-40% of the original cohort has died; by age 92,
              approximately 65-70%. All other bands are scaled to fit within the remaining
              "living" probability, so bands always sum to 100%.
            </p>
            <p>
              The band thresholds are expressed in real (inflation-adjusted) terms. This
              prevents nominal growth from artificially shifting paths into higher bands.
              A portfolio that merely keeps pace with inflation stays in the same band
              regardless of how large the nominal number grows.
            </p>
          </Sub>
          <Sub title="Wealth Trajectories (Fan Chart)">
            <p>
              Shows the distribution of portfolio values across all {inputs.numSimulations.toLocaleString()} paths at
              each age. The solid line is the median (50th percentile) — half of all
              paths end above this value, half below.
            </p>
            <p>
              The optional percentile bands (enable with checkboxes) show the
              10th-90th and 25th-75th percentile ranges. They are hidden by default
              because compounding over 45 years makes the outer band extremely wide
              (potentially 20-50x between the 10th and 90th percentiles at age 90),
              which makes the chart hard to read.
            </p>
            <p>
              The "Real terms" toggle divides all portfolio values by cumulative inflation
              to show purchasing power in today's dollars. In nominal terms, a $10M
              portfolio in 40 years at 2.8% inflation is worth only
              {' '}{formatCompactCurrency(10_000_000 / Math.pow(1 + inputs.inflationRate, 40))} in
              today's purchasing power. The real-terms view removes this illusion.
            </p>
            <p>
              The draggable retirement age slider reruns the full simulation instantly,
              letting you see how each additional year of work changes the outcome distribution.
            </p>
          </Sub>
          <Sub title="Spending Plan">
            <p>
              A deterministic chart showing planned annual spending at each age.
              This is the exact withdrawal schedule applied to every Monte Carlo path
              (before inflation adjustment, which is added on top). The shaded regions
              show the three spending phases; the vertical line marks retirement.
              No randomness here — this is the input, not the output.
            </p>
          </Sub>
          <Sub title="Scenario Comparison">
            <p>
              Runs three fully independent simulations with retirement at ages 52, 55,
              and 58, holding all other inputs constant. The median wealth trajectories
              of all three are overlaid on a single chart for direct comparison.
            </p>
            <p>
              Each scenario card shows: success rate at that retirement age, median
              terminal wealth at your planning age, and the 85%-confidence sustainable
              monthly spend (computed via separate binary search for each scenario).
            </p>
            <p>
              The "What if carry never comes?" toggle zeroes out all carry awards in
              all three scenarios simultaneously, showing the baseline without any PE
              distributions.
            </p>
          </Sub>
          <Sub title="Stress Tests">
            <p>
              Five historical or stylized adverse scenarios applied to your current inputs
              with a reduced simulation count (500 paths) for speed:
            </p>
            <ul className="list-disc pl-5 grid gap-1">
              <li><strong>2008-09 Financial Crisis</strong>: Year 1 return -37%, Year 2 +26.5%,
                  then normal stochastic paths</li>
              <li><strong>2000-02 Dot-com Bust</strong>: Three consecutive down years:
                  -9%, -12%, -22%, then normal paths</li>
              <li><strong>1970s Stagflation</strong>: 10-year mean shift to +3% returns with
                  9% inflation, then normal paths; preserves stochastic variance</li>
              <li><strong>Retire at Peak (worst case)</strong>: Year 1 return -45% — the
                  single worst possible scenario for sequence risk</li>
              <li><strong>Japan 1990-2000</strong>: 10-year mean shift to 0% returns with
                  0.5% inflation (deflationary stagnation)</li>
            </ul>
            <p>
              Stress scenarios apply a mean shift to returns while preserving Monte Carlo
              variance — all 500 paths still diverge, but the average is shifted toward
              the scenario target. Historical crash scenarios (2008, dot-com) apply fixed
              exact returns for the designated crash years, then revert to stochastic paths.
            </p>
          </Sub>
          <Sub title="Carry Awards">
            <p>
              The aggregate chart (top) shows combined net distributions and GP commit
              outflows across all awards in a given calendar year, plus the cumulative
              net cash position. Useful for understanding peak GP commit years vs.
              peak distribution years.
            </p>
            <p>
              Individual award charts below show the 12-year distribution schedule for
              each award. The x-axis labels show the calendar year, Fund Year (FY1-FY12),
              and the distribution curve percentage for that year, making it easy to
              verify the timing aligns with your fund's expected lifecycle.
            </p>
          </Sub>
          <Sub title="Income Tax">
            <p>
              A static analysis (not simulated) of your current-year household tax
              situation using 2025 federal brackets. Shows the income waterfall from
              gross income to spendable cash, the federal bracket fill visualization,
              and the annual savings breakdown.
            </p>
            <p>
              This panel updates live with sidebar inputs. It does not model
              AMT, investment income surtaxes, state-specific deductions, qualified
              dividend treatment, or capital gains stacking rules.
            </p>
          </Sub>
        </Section>

        <Section id="metrics" title="Key Metrics Explained">
          <Sub title="Success Rate">
            <p>
              The fraction of {inputs.numSimulations.toLocaleString()} simulated paths in which
              the portfolio never reached zero during retirement. A path that runs out
              of money at age 89 when your planning age is 92 counts as a failure.
              Success means money remaining at every age through your planning horizon —
              it says nothing about how much remains. A 99% success rate might mean
              dying with $50M; an 80% rate might still mean dying with $5M in the
              median scenario.
            </p>
          </Sub>
          <Sub title="Ruin Probability">
            <p>
              Exactly 1 minus the success rate. The probability that your portfolio
              depletes at some point during retirement. Note the distinction between
              ruin probability and running out of money at end of life: the model
              counts any depletion event, even temporary or near end-of-plan.
            </p>
          </Sub>
          <Sub title="Median Terminal Wealth">
            <p>
              The portfolio balance at your planning age in the median (50th percentile)
              simulation. Expressed in nominal dollars — not inflation-adjusted. To find
              the real purchasing power, divide by
              {' '}(1 + {formatPercentage(inputs.inflationRate, 1)})^{inputs.planningAge - inputs.currentAge} =
              {' '}{Math.pow(1 + inputs.inflationRate, inputs.planningAge - inputs.currentAge).toFixed(2)}x.
              A nominal {formatCompactCurrency(1_000_000)} at your planning age is worth
              approximately {formatCompactCurrency(1_000_000 / Math.pow(1 + inputs.inflationRate, inputs.planningAge - inputs.currentAge))} in today's dollars.
            </p>
          </Sub>
          <Sub title="Safe Sustainable Spend">
            <p>
              The annual go-go spending level at which your success rate equals exactly 85%.
              Computed via 10-step binary search between $25K and $750K per year, with each
              step averaging 2 batches of 400 paths. Slow-go is set at 75% and no-go at
              60% of the go-go amount, preserving the spending smile shape throughout the search.
            </p>
            <p>
              The 85% confidence threshold is a common financial planning convention.
              It means you have an 85% chance of never running out of money — a 15% chance
              of depletion. More conservative planners use 90-95%; more aggressive planners
              accept 75-80%.
            </p>
          </Sub>
          <Sub title="Sequence of Returns Risk Warning">
            <p>
              Triggered when the 10th percentile portfolio drops more than 25% in the
              first 5 years of retirement. Sequence-of-returns risk is the single largest
              financial risk unique to retirement (vs. accumulation). A 40% market crash
              in year 1 of retirement is dramatically worse than the same crash in year
              20, because withdrawals accelerate the depletion of an already-diminished
              portfolio. The standard mitigation is a cash buffer (1-3 years of spending
              in cash or short-term bonds) that can be drawn on during a crash rather than
              forcing portfolio sales at depressed prices.
            </p>
          </Sub>
        </Section>

        <Section id="limitations" title="Known Limitations">
          <Sub title="IID log-normal returns understate tail risk">
            <p>
              Each year's return is drawn independently with no memory of prior years.
              Real markets exhibit volatility clustering (bad years tend to cluster),
              serial correlation (momentum and mean reversion), and fat tails (crashes
              are more frequent and severe than a normal distribution predicts). The
              2008 crisis, for example, was an approximately 6-sigma event under normal
              distribution assumptions — but it happened.
            </p>
            <p>
              The practical effect: the model's estimated probability of ruin is likely
              optimistic in stress scenarios. The stress test tab provides some compensation
              by force-testing historical crash sequences, but does not fully capture
              tail correlations.
            </p>
          </Sub>
          <Sub title="Single portfolio, no correlation structure">
            <p>
              All assets are collapsed into one return-and-volatility pair. A real
              PE professional's portfolio includes publicly traded equities, bonds,
              private equity (illiquid, J-curve profile, vintage-year correlated),
              real estate, and cash — each with different risk profiles that often
              move adversely together in a crisis. This model treats all investable
              assets as a single diversified pool.
            </p>
          </Sub>
          <Sub title="Fixed asset allocation throughout simulation">
            <p>
              The model does not glide-path your allocation. Running the simulation
              with 15% volatility (equity-heavy) from age 47 to age 92 implies you
              hold the same high-equity allocation at 85 as at 47. Most investors
              de-risk over time. If you plan to reduce equity exposure in retirement,
              consider using a blended expected return and volatility that reflects
              your intended long-run allocation, or run a separate scenario with
              lower return and lower volatility to represent a more conservative
              retirement portfolio.
            </p>
          </Sub>
          <Sub title="Withdrawal tax is a blended estimate">
            <p>
              The 22% ordinary income rate on tax-deferred withdrawals is a planning
              estimate. Several factors can push this higher: SS income stacking (up to
              85% of SS is taxable and stacks on top of IRA distributions), RMDs after
              age 73 that force withdrawals regardless of need, and large inherited
              IRA balances. For a PE professional with a substantial traditional 401k
              balance, the marginal rate on retirement distributions could be 24-32%.
            </p>
          </Sub>
          <Sub title="Static illiquid asset values">
            <p>
              Home equity grows as the mortgage is paid down, but the model does not
              update illiquid asset values in the simulation. PE fund NAV changes,
              real estate appreciation, and other illiquid value changes are not
              modeled year-by-year. For large illiquid positions with expected
              liquidity events, model them as carry awards with an appropriate
              distribution curve.
            </p>
          </Sub>
          <Sub title="No Roth conversions, tax-loss harvesting, or QCDs">
            <p>
              The model does not simulate opportunistic Roth conversion strategies
              (converting traditional IRA assets in low-income years before SS and
              RMDs begin), tax-loss harvesting in taxable accounts, qualified charitable
              distributions from IRAs after age 70.5, or qualified opportunity zone
              investments. These strategies can meaningfully reduce lifetime tax burden
              for high-net-worth individuals and are not reflected in the simulation's
              outcomes.
            </p>
          </Sub>
          <Sub title="No AMT modeling">
            <p>
              Alternative Minimum Tax can apply to high-income earners with significant
              deductions, incentive stock options, or private activity bond interest.
              The model computes only regular income tax.
            </p>
          </Sub>
          <Warn>
            The gap between this model's simplifications and your actual tax situation
            is most meaningful for very high income households (above $500K/year) and
            those with large tax-deferred balances (above $2M). In those cases, the
            model's success rates are likely modestly overstated and the sustainable
            spend figure may be slightly high. A tax-aware Monte Carlo model from a
            fee-only financial planner can provide a more precise estimate.
          </Warn>
        </Section>

      </div>
    </div>
  );
}
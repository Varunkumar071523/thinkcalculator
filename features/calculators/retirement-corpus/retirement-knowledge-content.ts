import type { CalculatorKnowledgeContent } from "@/types/calculator-content"

export const retirementKnowledgeContent = {
  title: "Understand a Retirement Corpus projection",
  description: "See exactly how the accumulation and retirement phases connect, how the inflation-adjusted withdrawal is calculated, and why this remains an illustrative projection rather than a retirement plan.",
  sections: [
    {
      id: "definition", title: "What this calculator projects", type: "overview",
      content: [{ type: "paragraph", text: "This calculator connects two phases into one projection: an accumulation phase that grows your current savings and monthly contributions until retirement, and a retirement phase that draws a monthly withdrawal from that corpus until your selected life expectancy. The withdrawal is entered in today's money and grows in nominal terms each year with assumed inflation, so its real purchasing power stays level throughout retirement." }],
    },
    {
      id: "inputs", title: "Inputs used", type: "input-guide",
      content: [{ type: "list", style: "numbered", items: [
        "Enter your current age, planned retirement age, and life expectancy.",
        "Enter your current savings already set aside for retirement, and the monthly contribution you plan to add until retirement.",
        "Enter an expected annual return for the accumulation phase, before retirement.",
        "Enter an expected annual return for the retirement phase; it starts equal to the accumulation return but can be lowered to reflect a more conservative post-retirement allocation.",
        "Enter your desired monthly withdrawal in today's money, and an assumed annual inflation rate.",
      ] }],
    },
    {
      id: "accumulation", title: "How the accumulation phase compounds", type: "how-it-works",
      content: [{ type: "paragraph", text: "Each month, the monthly contribution is added to the balance first, and the combined total then earns that month's share of the accumulation-phase annual return. Existing current savings sit in the same balance from month one, so both grow on the same monthly schedule rather than on two separate compounding clocks." }],
    },
    {
      id: "handoff", title: "How the two phases connect", type: "how-it-works",
      content: [{ type: "callout", variant: "important", title: "One corpus figure, calculated once", text: "The balance at the end of the very last accumulation month is used, unchanged, as the opening balance of the retirement phase. It is not rounded, re-entered, or recalculated a second time — the accumulation phase's closing figure and the retirement phase's opening figure are the same number." }],
    },
    {
      id: "withdrawal", title: "How the withdrawal grows with inflation", type: "how-it-works",
      content: [{ type: "paragraph", text: "\"Today's money\" here means money at the start of retirement. Year 1 of retirement withdraws exactly the amount you entered; each later retirement year's nominal monthly withdrawal is that amount multiplied by (1 + inflation rate) raised to the number of completed retirement years. Within each retirement year, the monthly withdrawal is taken from the opening balance first, and only the remaining balance earns that month's retirement-phase return — the same order of operations the SWP Calculator uses. Inflation is applied at exactly this one place; it never adjusts the accumulation phase and is never applied a second time to the same year." }],
    },
    {
      id: "comparison", title: "Retirement Corpus compared with SIP and SWP", type: "comparison",
      content: [{ type: "table", caption: "How each calculator's contribution or withdrawal direction differs", headers: ["Calculator", "Direction", "What it estimates"], rows: [
        ["SIP / Step-up SIP", "Regular money in", "Corpus built from repeated contributions alone"],
        ["SWP", "Regular money out, fixed amount", "How long an existing lumpsum supports a constant withdrawal"],
        ["Retirement Corpus", "Money in, then money out, growing", "A single projection: contributions build a corpus, then an inflation-adjusted withdrawal draws it down"],
      ] }],
    },
    {
      id: "interpretation", title: "How to read the results", type: "interpretation",
      content: [{ type: "paragraph", text: "Corpus at retirement is the projected balance the moment contributions stop. In the retirement schedule, total withdrawn is every rupee actually paid out (including any reduced final withdrawal), and total growth is the estimated return earned during retirement. If the corpus is exhausted before life expectancy, the exact month and age are reported and the balance is held at zero rather than going negative; otherwise, the remaining balance at life expectancy is the projected surplus." }],
    },
    {
      id: "mistakes", title: "Common mistakes", type: "common-mistakes",
      content: [{ type: "list", style: "bullet", items: [
        "Reading the desired monthly withdrawal as a value that stays fixed in rupee terms throughout retirement — it is fixed in today's purchasing power, and the actual rupee amount rises with assumed inflation.",
        "Using the same optimistic return for both phases without checking whether it produces an implausibly large surplus, rather than trying a more conservative post-retirement rate.",
        "Treating a comfortable projected surplus as guaranteed income, when it depends entirely on the constant assumed rates holding for decades.",
        "Forgetting that this projection excludes taxation, healthcare costs, government pension income, and market volatility.",
      ] }],
    },
    {
      id: "tips", title: "Practical scenario checks", type: "practical-tips",
      content: [{ type: "list", style: "bullet", items: [
        "Lower the post-retirement return below the accumulation-phase return to see a more conservative retirement outcome.",
        "Increase the desired monthly withdrawal or shorten the accumulation period to see how quickly a corpus can become insufficient.",
        "Set inflation to 0% to isolate the effect of a genuinely flat, non-escalating withdrawal.",
        "Compare a short accumulation period against a long one to see how sensitive the corpus is to years of compounding.",
      ] }],
    },
    {
      id: "benefits", title: "Potential planning benefits", type: "benefits",
      content: [{ type: "list", style: "bullet", items: [
        "Connects saving and spending into a single, consistent projection instead of two disconnected calculators.",
        "Makes the exact accumulation-to-retirement handoff explicit rather than hidden.",
        "Shows whether a chosen withdrawal keeps pace with inflation without silently eroding purchasing power.",
        "Separates money contributed from estimated growth in both phases.",
      ] }],
    },
    {
      id: "limits", title: "Assumptions and limitations", type: "limitations",
      content: [{ type: "callout", variant: "warning", title: "Illustrative projection, not a retirement plan", text: "This calculator is closer to real financial planning than most calculators on this site, so read this carefully: it is an illustrative projection based on constant assumed rates, not a retirement plan and not financial advice. It does not model sequence-of-returns risk (the order in which market gains and losses occur), healthcare or long-term-care costs, taxation of contributions or withdrawals, Social-Security-equivalent government pension income, or any statutory rules. Actual retirement outcomes depend on market volatility, policy changes, health events, and personal circumstances that a constant-rate model cannot capture. Consult a qualified financial adviser before making retirement decisions." }],
    },
  ],
  relatedLinks: [
    { title: "Retirement corpus meaning", description: "Read the concise glossary definition.", href: "/glossary/retirement-corpus" },
    { title: "SIP Calculator", description: "Estimate the future value of regular monthly contributions.", href: "/finance/sip-calculator" },
    { title: "Step-up SIP Calculator", description: "Estimate a SIP that increases contributions yearly.", href: "/finance/step-up-sip-calculator" },
    { title: "SWP Calculator", description: "Estimate how long a lumpsum investment supports fixed monthly withdrawals.", href: "/finance/swp-calculator" },
    { title: "Inflation Calculator", description: "Estimate future cost or today's purchasing power of a future amount.", href: "/finance/inflation-calculator" },
  ],
} as const satisfies CalculatorKnowledgeContent

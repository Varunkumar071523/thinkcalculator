import {
  BriefcaseBusiness,
  Calculator,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  Landmark,
  PiggyBank,
  Percent,
  ReceiptIndianRupee,
  TrendingUp,
  WalletCards,
} from "lucide-react"

import type {
  CalculatorSummary,
  FooterGroup,
  SiteCategory,
  SiteLink,
} from "@/types/site"

export const siteConfig = {
  name: "ThinkCalculator",
  tagline: "Calculate. Compare. Decide.",
  description:
    "Clear, practical calculators for finance, business, health, education, and everyday decisions in India.",
  url: "https://thinkcalculator.in",
} as const

export const mainNavigation: SiteLink[] = [
  { title: "Calculators", href: "/calculators" },
  { title: "Finance", href: "/finance" },
  { title: "Business", href: "/business" },
  { title: "Health", href: "/health" },
  { title: "Education", href: "/education" },
]

export const categories: SiteCategory[] = [
  {
    title: "Finance",
    href: "/finance",
    description: "Plan loans, investments, taxes, and savings with confidence.",
    icon: IndianRupee,
  },
  {
    title: "Business",
    href: "/business",
    description: "Work through GST, margins, pricing, and everyday business numbers.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Health",
    href: "/health",
    description: "Understand useful health measurements with simple explanations.",
    icon: HeartPulse,
  },
  {
    title: "Education",
    href: "/education",
    description: "Make percentages, grades, and study calculations easier.",
    icon: GraduationCap,
  },
]

export const popularCalculators: CalculatorSummary[] = [
  { title: "EMI Calculator", href: "/finance/emi-calculator", description: "Estimate monthly loan payments and total interest.", category: "Finance", icon: WalletCards },
  { title: "SIP Calculator", href: "/finance/sip-calculator", description: "Project the future value of regular investments.", category: "Finance", icon: TrendingUp },
  { title: "Lumpsum Calculator", href: "/finance/lumpsum-calculator", description: "Estimate the future value of a one-time investment.", category: "Finance", icon: PiggyBank },
  { title: "Income Tax Calculator", href: "/calculators", description: "Get ready to estimate your income tax liability.", category: "Finance", icon: Landmark },
  { title: "GST Calculator", href: "/calculators", description: "Calculate GST-inclusive and GST-exclusive amounts.", category: "Business", icon: ReceiptIndianRupee },
  { title: "FD Calculator", href: "/calculators", description: "Estimate fixed-deposit maturity value and interest.", category: "Finance", icon: IndianRupee },
  { title: "Percentage Calculator", href: "/calculators", description: "Solve common percentage questions quickly.", category: "Everyday", icon: Percent },
]

export const footerGroups: FooterGroup[] = [
  {
    title: "Calculators",
    links: [
      { title: "All calculators", href: "/calculators" },
      { title: "Finance", href: "/finance" },
      { title: "Business", href: "/business" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Health", href: "/health" },
      { title: "Education", href: "/education" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy policy", href: "/privacy-policy" },
      { title: "Disclaimer", href: "/disclaimer" },
    ],
  },
]

export const calculatorIcon = Calculator

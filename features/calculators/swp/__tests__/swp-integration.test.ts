import { describe,expect,it } from "vitest"
import sitemap from "@/app/sitemap"
import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { getGlossaryStaticParams,getGlossaryTermBySlug,getPublicTopicBySlug } from "@/features/content"
import { createCalculatorMetadata,createCanonicalUrl } from "@/lib/seo"
import { swpCalculatorDefinition } from "../swp-definition"
import { swpKnowledgeContent } from "../swp-knowledge-content"
import { swpWorkedExample } from "../swp-content"
import { calculateSWP } from "../calculate-swp"
import { formatIndianCurrency } from "@/lib/formatters"

describe("SWP production integration",()=>{
  it("registers a unique eleventh published Finance calculator",()=>{expect(calculatorRegistry.filter(item=>item.id===swpCalculatorDefinition.id)).toEqual([swpCalculatorDefinition]);expect(calculatorRegistry.filter(item=>item.status==="published")).toHaveLength(20);expect(swpCalculatorDefinition).toMatchObject({category:"Finance",canonicalPath:"/finance/swp-calculator",status:"published"});for(const values of [calculatorRegistry.map(item=>item.id),calculatorRegistry.map(item=>item.slug),calculatorRegistry.map(item=>item.canonicalPath)])expect(new Set(values).size).toBe(values.length)})
  it("is derived into directory, Finance, homepage search, and sitemap",()=>{const path=swpCalculatorDefinition.canonicalPath;expect(availableCalculators.map(item=>item.href)).toContain(path);expect(financeCalculators.map(item=>item.href)).toContain(path);expect(calculatorRegistry.filter(item=>item.status==="published").map(item=>item.canonicalPath)).toContain(path);expect(sitemap().filter(item=>item.url===createCanonicalUrl(path))).toHaveLength(1)})
  it("belongs to the public Investing topic",()=>{const investing=getPublicTopicBySlug("investing")!;expect(investing.calculators.map(item=>item.id)).toContain(swpCalculatorDefinition.id);expect(investing.glossaryTerms.map(item=>item.id)).toContain("glossary-swp")})
  it("publishes a substantive reciprocal glossary entry",()=>{const term=getGlossaryTermBySlug("swp");expect(term).toMatchObject({id:"glossary-swp",status:"published",canonicalPath:"/glossary/swp"});expect(term!.sections.length).toBeGreaterThanOrEqual(4);expect(term!.relatedCalculators.map(item=>item.href)).toEqual(expect.arrayContaining(["/finance/swp-calculator","/finance/sip-calculator"]));expect(getGlossaryStaticParams()).toContainEqual({slug:"swp"});expect(sitemap().filter(item=>item.url===createCanonicalUrl("/glossary/swp"))).toHaveLength(1);expect(swpKnowledgeContent.relatedLinks.map(item=>item.href)).toContain("/glossary/swp")})
  it("uses unique clean metadata",()=>{const metadata=createCalculatorMetadata(swpCalculatorDefinition);expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/swp-calculator"));expect(String(metadata.alternates?.canonical)).not.toContain("?");expect(swpCalculatorDefinition.metadata.title).not.toBe("");expect(swpCalculatorDefinition.metadata.description).not.toBe("")})
  it("derives the worked example from production calculation",()=>{const result=calculateSWP({initialInvestment:5_000_000,monthlyWithdrawal:35_000,expectedAnnualReturn:8,withdrawalMode:"fixedDuration",durationYears:20});const values=Object.fromEntries(swpWorkedExample.results.map(item=>[item.label,item.value]));expect(values["Total withdrawn"]).toBe(formatIndianCurrency(result.totalWithdrawn));expect(values["Total growth"]).toBe(formatIndianCurrency(result.totalGrowth));expect(values["Remaining balance"]).toBe(formatIndianCurrency(result.remainingBalance))})
})

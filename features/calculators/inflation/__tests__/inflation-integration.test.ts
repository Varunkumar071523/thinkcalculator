import { describe,expect,it } from "vitest"
import sitemap from "@/app/sitemap"
import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { getGlossaryStaticParams,getGlossaryTermBySlug,getPublicTopicBySlug } from "@/features/content"
import { createCalculatorMetadata,createCanonicalUrl } from "@/lib/seo"
import { inflationCalculatorDefinition } from "../inflation-definition"
import { inflationKnowledgeContent } from "../inflation-knowledge-content"
import { inflationWorkedExample } from "../inflation-content"
import { calculateInflationFutureCost } from "../calculate-inflation"
import { formatIndianCurrency } from "@/lib/formatters"

describe("Inflation production integration",()=>{
  it("registers a unique twelfth published Finance calculator",()=>{expect(calculatorRegistry.filter(item=>item.id===inflationCalculatorDefinition.id)).toEqual([inflationCalculatorDefinition]);expect(calculatorRegistry.filter(item=>item.status==="published")).toHaveLength(14);expect(inflationCalculatorDefinition).toMatchObject({category:"Finance",canonicalPath:"/finance/inflation-calculator",status:"published"});for(const values of [calculatorRegistry.map(item=>item.id),calculatorRegistry.map(item=>item.slug),calculatorRegistry.map(item=>item.canonicalPath)])expect(new Set(values).size).toBe(values.length)})
  it("is derived into directory, Finance, homepage search, and sitemap",()=>{const path=inflationCalculatorDefinition.canonicalPath;expect(availableCalculators.map(item=>item.href)).toContain(path);expect(financeCalculators.map(item=>item.href)).toContain(path);expect(calculatorRegistry.filter(item=>item.status==="published").map(item=>item.canonicalPath)).toContain(path);expect(sitemap().filter(item=>item.url===createCanonicalUrl(path))).toHaveLength(1)})
  it("belongs to the public Investing topic",()=>{const investing=getPublicTopicBySlug("investing")!;expect(investing.calculators.map(item=>item.id)).toContain(inflationCalculatorDefinition.id);expect(investing.glossaryTerms.map(item=>item.id)).toContain("glossary-inflation")})
  it("publishes a substantive reciprocal glossary entry",()=>{const term=getGlossaryTermBySlug("inflation");expect(term).toMatchObject({id:"glossary-inflation",status:"published",canonicalPath:"/glossary/inflation"});expect(term!.sections.length).toBeGreaterThanOrEqual(4);expect(term!.relatedCalculators.map(item=>item.href)).toEqual(expect.arrayContaining(["/finance/inflation-calculator","/finance/sip-calculator"]));expect(getGlossaryStaticParams()).toContainEqual({slug:"inflation"});expect(sitemap().filter(item=>item.url===createCanonicalUrl("/glossary/inflation"))).toHaveLength(1);expect(inflationKnowledgeContent.relatedLinks.map(item=>item.href)).toContain("/glossary/inflation")})
  it("uses unique clean metadata",()=>{const metadata=createCalculatorMetadata(inflationCalculatorDefinition);expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/inflation-calculator"));expect(String(metadata.alternates?.canonical)).not.toContain("?");expect(inflationCalculatorDefinition.metadata.title).not.toBe("");expect(inflationCalculatorDefinition.metadata.description).not.toBe("")})
  it("does not tie into Retirement Corpus, and explicitly discloses the Cost Inflation Index and CPI-data exclusions",()=>{const text=JSON.stringify({def:inflationCalculatorDefinition,content:inflationKnowledgeContent}).toLowerCase();expect(text).not.toContain("retirement corpus");expect(text).toContain("cost inflation index");expect(text).toContain("consumer price index");expect(text).toContain("not an economic forecast")})
  it("derives the worked example from production calculation",()=>{const result=calculateInflationFutureCost({mode:"futureCost",amount:100_000,annualInflationRate:6,years:10});const values=Object.fromEntries(inflationWorkedExample.results.map(item=>[item.label,item.value]));expect(values["Equivalent future cost"]).toBe(formatIndianCurrency(result.futureValue));expect(values["Total inflation impact"]).toBe(formatIndianCurrency(result.totalInflationImpact))})
})

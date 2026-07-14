import { describe,expect,it } from "vitest"
import sitemap from "@/app/sitemap"
import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { getGlossaryStaticParams,getGlossaryTermBySlug,getPublicTopicBySlug } from "@/features/content"
import { createCalculatorMetadata,createCanonicalUrl } from "@/lib/seo"
import { stepUpSIPCalculatorDefinition } from "../step-up-sip-definition"
import { stepUpSIPKnowledgeContent } from "../step-up-sip-knowledge-content"
import { stepUpSIPWorkedExample } from "../step-up-sip-content"
import { calculateStepUpSIP } from "../calculate-step-up-sip"
import { formatIndianCurrency } from "@/lib/formatters"

describe("Step-up SIP production integration",()=>{
  it("registers a unique tenth published Finance calculator",()=>{expect(calculatorRegistry.filter(item=>item.id===stepUpSIPCalculatorDefinition.id)).toEqual([stepUpSIPCalculatorDefinition]);expect(calculatorRegistry.filter(item=>item.status==="published")).toHaveLength(12);expect(stepUpSIPCalculatorDefinition).toMatchObject({category:"Finance",canonicalPath:"/finance/step-up-sip-calculator",status:"published"});for(const values of [calculatorRegistry.map(item=>item.id),calculatorRegistry.map(item=>item.slug),calculatorRegistry.map(item=>item.canonicalPath)])expect(new Set(values).size).toBe(values.length)})
  it("is derived into directory, Finance, homepage search, and sitemap",()=>{const path=stepUpSIPCalculatorDefinition.canonicalPath;expect(availableCalculators.map(item=>item.href)).toContain(path);expect(financeCalculators.map(item=>item.href)).toContain(path);expect(calculatorRegistry.filter(item=>item.status==="published").map(item=>item.canonicalPath)).toContain(path);expect(sitemap().filter(item=>item.url===createCanonicalUrl(path))).toHaveLength(1)})
  it("belongs to the public Investing topic",()=>{const investing=getPublicTopicBySlug("investing")!;expect(investing.calculators.map(item=>item.id)).toContain(stepUpSIPCalculatorDefinition.id);expect(investing.glossaryTerms.map(item=>item.id)).toContain("glossary-step-up-sip")})
  it("publishes a substantive reciprocal glossary entry",()=>{const term=getGlossaryTermBySlug("step-up-sip");expect(term).toMatchObject({id:"glossary-step-up-sip",status:"published",canonicalPath:"/glossary/step-up-sip"});expect(term!.sections.length).toBeGreaterThanOrEqual(4);expect(term!.relatedCalculators.map(item=>item.href)).toEqual(expect.arrayContaining(["/finance/step-up-sip-calculator","/finance/sip-calculator"]));expect(getGlossaryStaticParams()).toContainEqual({slug:"step-up-sip"});expect(sitemap().filter(item=>item.url===createCanonicalUrl("/glossary/step-up-sip"))).toHaveLength(1);expect(stepUpSIPKnowledgeContent.relatedLinks.map(item=>item.href)).toContain("/glossary/step-up-sip")})
  it("uses unique clean metadata",()=>{const metadata=createCalculatorMetadata(stepUpSIPCalculatorDefinition);expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/step-up-sip-calculator"));expect(String(metadata.alternates?.canonical)).not.toContain("?");expect(stepUpSIPCalculatorDefinition.metadata.title).not.toBe("");expect(stepUpSIPCalculatorDefinition.metadata.description).not.toBe("")})
  it("derives the worked example from production calculation",()=>{const result=calculateStepUpSIP({initialMonthlyInvestment:10_000,stepUpMode:"percentage",annualStepUpValue:10,expectedAnnualReturn:12,durationYears:10});const values=Object.fromEntries(stepUpSIPWorkedExample.results.map(item=>[item.label,item.value]));expect(values["Total invested"]).toBe(formatIndianCurrency(result.totalInvested));expect(values["Estimated maturity value"]).toBe(formatIndianCurrency(result.estimatedMaturityValue));expect(values["Final monthly SIP"]).toBe(formatIndianCurrency(result.finalMonthlyInvestment));expect(values["Regular SIP maturity value"]).toBe(formatIndianCurrency(result.regularSipMaturityValue))})
})

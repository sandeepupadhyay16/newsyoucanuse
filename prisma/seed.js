const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/idea_harvester?schema=public&connection_limit=15";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const projects = [
  {
    title: "Generative AI for Synthesizing Personalized Patient Education & Trial Triage Materials",
    problemStatement: "Clinical trial patient education leaflets are often written in overly complex medical jargon, causing high patient drop-out rates and low engagement.",
    integrations: ["Epic EHR", "Custom APIs"],
    budgetStatus: "Pre-allocated in standard budget",
    stakeholderStatus: "VP of Oncology Clinical Operations aligned",
    opportunityCost: "High patient dropout rates persist, delaying trial completion and increasing phase progression cost.",
    businessCase: "Automatically rewrite complex trial documents into patient-friendly materials, reducing drop-out rates by 20%.",
    dataReadiness: "Historical patient drop-out lists and medical terminology databases are indexed and accessible.",
    financialRoi: 280000.0,
    budgetRequiredVal: 95000.0,
    execSponsor: "Colleen Stranzl, Commercial AI Strategy Lead",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://patient-triage.company.internal",
    phase: "Curated",
    // Compatibility scores
    budgetAvailabilityScore: 85.0,
    dataAvailabilityScore: 75.0,
    stakeholderReadinessScore: 80.0,
    impactOfNotDoingScore: 80.0,
    financialBusinessCaseScore: 90.0,
    budgetRequiredScore: 85.0,
    readinessScore: 80.5,
    // v2 Scores
    source: "Transcript",
    sourceUrl: "",
    author: "",
    impactWorkingScore: 85.0,
    impactDevelopmentScore: 75.0,
    feasibilityScore: 80.0,
    relevancyScore: 80.5, // 0.4*85 + 0.3*75 + 0.3*80
    agendaTimeBlock: 0,
    assignedExpertId: "",
    functionalDomain: "Patient Identification",
    therapeuticAreas: ["Oncology", "Internal Medicine"]
  },
  {
    title: "Predictive ML for Real-Time Clinical Trial Site Enrollment Forecasting",
    problemStatement: "Predicting trial enrollment speeds at global clinical sites is highly inaccurate, causing inventory waste or supply shortages.",
    integrations: ["Salesforce CRM", "Veeva Link / CRM"],
    budgetStatus: "Requested; awaiting approval",
    stakeholderStatus: "Clinical Operations Head aligned; local site leads locked",
    opportunityCost: "Drug supply waste and stockouts at active clinical sites, leading to project timeline delays.",
    businessCase: "Reduces clinical trial drug supply waste by 15% and site coordination overheads.",
    dataReadiness: "Historical clinical site enrollment logs and regional logistical shipping tables are cleaned and ingested.",
    financialRoi: 520000.0,
    budgetRequiredVal: 150000.0,
    execSponsor: "Dr. Eric Topol, Scripps Research Institute",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://trial-predictive.company.internal",
    phase: "Harvested",
    budgetAvailabilityScore: 90.0,
    dataAvailabilityScore: 80.0,
    stakeholderReadinessScore: 70.0,
    impactOfNotDoingScore: 90.0,
    financialBusinessCaseScore: 80.0,
    budgetRequiredScore: 70.0,
    readinessScore: 81.0,
    source: "Newsletter",
    sourceUrl: "https://www.aimedtech-weekly.com/news/predictive-trial-supply-chains",
    author: "Sarah Jenkins, AI MedTech Weekly",
    impactWorkingScore: 90.0,
    impactDevelopmentScore: 80.0,
    feasibilityScore: 70.0,
    relevancyScore: 81.0,
    agendaTimeBlock: 0,
    assignedExpertId: "",
    functionalDomain: "Campaign Measurement Intelligence",
    therapeuticAreas: ["Vaccines", "Internal Medicine"]
  },
  {
    title: "Large Language Models for Automating FDA Regulatory Submission Portfolios",
    problemStatement: "Drafting FDA approval portfolios involves compiling thousands of clinical trial logs and cross-referencing compliance guidelines manually.",
    integrations: ["Custom APIs", "Document Repositories"],
    budgetStatus: "Fully approved under steering committee priority",
    stakeholderStatus: "Regulatory Affairs Board aligned, clinical panel fully committed",
    opportunityCost: "Months of delay in compiling documentation, postponing drug launch and patient access.",
    businessCase: "Generates draft IND/NDA sections automatically with strict grounding in source clinical databases, reducing dossier generation time by 40%.",
    dataReadiness: "Anonymized clinical logs and FDA draft guidance documentation are pre-processed and indexed in vector store.",
    financialRoi: 950000.0,
    budgetRequiredVal: 250000.0,
    execSponsor: "Colleen Stranzl, Commercial AI Strategy Lead",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://fda-automator.company.internal",
    phase: "Scheduled",
    budgetAvailabilityScore: 95.0,
    dataAvailabilityScore: 90.0,
    stakeholderReadinessScore: 85.0,
    impactOfNotDoingScore: 95.0,
    financialBusinessCaseScore: 90.0,
    budgetRequiredScore: 85.0,
    readinessScore: 90.5,
    source: "Transcript",
    sourceUrl: "",
    author: "",
    impactWorkingScore: 95.0,
    impactDevelopmentScore: 90.0,
    feasibilityScore: 85.0,
    relevancyScore: 90.5,
    agendaTimeBlock: 30,
    assignedExpertId: "", // Will map to Prof. Regina Barzilay
    functionalDomain: "Field Force Automation",
    therapeuticAreas: ["Rare Diseases", "Oncology"]
  },
  {
    title: "Multi-Modal Vision-Language Models for Advanced Pathology Scan Pre-Screening",
    problemStatement: "Pathology diagnostic pipelines face massive backlogs in analyzing tissue biopsy scans for rare diseases, leading to treatment delays.",
    integrations: ["Epic EHR", "Custom APIs"],
    budgetStatus: "Proposed for FY26 planning",
    stakeholderStatus: "Clinical research leaders committed; alignment is strong",
    opportunityCost: "Patients remain undiagnosed for critical weeks, missing crucial early-stage treatment windows.",
    businessCase: "Assist pathologists in pre-screening scans, flags potential cell abnormalities with 98.6% precision.",
    dataReadiness: "Historical biopsy database has been fully anonymized and indexed in image-vector cache.",
    financialRoi: 680000.0,
    budgetRequiredVal: 180000.0,
    execSponsor: "Dr. Fei-Fei Li, Stanford University",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://pathology-search.company.internal",
    phase: "Curated",
    budgetAvailabilityScore: 85.0,
    dataAvailabilityScore: 85.0,
    stakeholderReadinessScore: 80.0,
    impactOfNotDoingScore: 85.0,
    financialBusinessCaseScore: 85.0,
    budgetRequiredScore: 80.0,
    readinessScore: 83.5,
    source: "Intake Wizard",
    sourceUrl: "",
    author: "",
    impactWorkingScore: 85.0,
    impactDevelopmentScore: 85.0,
    feasibilityScore: 80.0,
    relevancyScore: 83.5,
    agendaTimeBlock: 0,
    assignedExpertId: "",
    functionalDomain: "Patient Identification",
    therapeuticAreas: ["Rare Diseases", "Oncology"]
  },
  {
    title: "Graph Neural Networks for De Novo Molecular Screening & Antibiotics Discovery",
    problemStatement: "Identifying viable molecular candidates for new antibiotics takes years and millions of dollars in wet lab trials.",
    integrations: ["Custom APIs", "Molecular Registry"],
    budgetStatus: "Under review for research funding allocation",
    stakeholderStatus: "Global R&D Lead aligned; lab leads committed",
    opportunityCost: "Slow lead identification cycle delays antibiotics development against resistant strains.",
    businessCase: "Predict candidate molecule properties in silico, reducing initial lab screening costs by 65%.",
    dataReadiness: "Molecular interaction logs and resistant strain genetic profiles are synced and cleared for processing.",
    financialRoi: 1450000.0,
    budgetRequiredVal: 380000.0,
    execSponsor: "Dr. John Jumper, Google DeepMind",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://gnn-antibiotics.company.internal",
    phase: "Harvested",
    budgetAvailabilityScore: 80.0,
    dataAvailabilityScore: 70.0,
    stakeholderReadinessScore: 65.0,
    impactOfNotDoingScore: 80.0,
    financialBusinessCaseScore: 70.0,
    budgetRequiredScore: 65.0,
    readinessScore: 72.5,
    source: "News Feed",
    sourceUrl: "https://www.fiercepharma.com/digital-health/gnn-ai-drug-discovery-antibiotics",
    author: "Phil Taylor, FiercePharma",
    impactWorkingScore: 80.0,
    impactDevelopmentScore: 70.0,
    feasibilityScore: 65.0,
    relevancyScore: 72.5,
    agendaTimeBlock: 0,
    assignedExpertId: "",
    functionalDomain: "Campaign Measurement Intelligence",
    therapeuticAreas: ["Inflammation & Immunology", "Internal Medicine"]
  },
  {
    title: "Privacy-Preserving Federated Learning across Cross-Hospital EHR Databases",
    problemStatement: "Accessing large clinical EHR datasets for rare disease research is restricted by HIPAA compliance, blocking centralized data pooling.",
    integrations: ["Epic EHR", "Custom APIs"],
    budgetStatus: "Fully approved under privacy research initiative",
    stakeholderStatus: "Clinical research heads aligned, medical boards fully committed",
    opportunityCost: "Lack of diverse clinical data slows rare disease diagnostic model development.",
    businessCase: "Train deep learning diagnostic models on decentralized patient records at multiple hospitals without data leaving their firewalls.",
    dataReadiness: "Participating hospital EHR endpoints are configured with secure enclave APIs.",
    financialRoi: 850000.0,
    budgetRequiredVal: 200000.0,
    execSponsor: "Dr. Fei-Fei Li, Stanford University",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://federated-learning.company.internal",
    phase: "Scheduled",
    budgetAvailabilityScore: 90.0,
    dataAvailabilityScore: 95.0,
    stakeholderReadinessScore: 85.0,
    impactOfNotDoingScore: 90.0,
    financialBusinessCaseScore: 95.0,
    budgetRequiredScore: 85.0,
    readinessScore: 90.0,
    source: "Intake Wizard",
    sourceUrl: "",
    author: "",
    impactWorkingScore: 90.0,
    impactDevelopmentScore: 95.0,
    feasibilityScore: 85.0,
    relevancyScore: 90.0,
    agendaTimeBlock: 45,
    assignedExpertId: "", // Will map to Dr. Fei-Fei Li
    functionalDomain: "Patient Identification",
    therapeuticAreas: ["Rare Diseases", "Vaccines"]
  },
  {
    title: "Multi-Agent AI Systems for Real-Time Global Pharmacovigilance Signal Ingestion",
    problemStatement: "Adverse event reports flow from hundreds of social media, news, and clinic sources, creating manual screening bottlenecks.",
    integrations: ["Custom APIs", "Veeva Link / CRM"],
    budgetStatus: "Requested; pending steering committee vote",
    stakeholderStatus: "Compliance director and medical safety boards aligned",
    opportunityCost: "Delayed safety signal detections, leading to potential regulatory fines and brand risk.",
    businessCase: "Scan global feeds in real time, extract adverse reaction symptoms, and flag safety alerts for compliance triage automatically.",
    dataReadiness: "Global news archives and medical feedback intake logs are set up for NLP ingestion.",
    financialRoi: 420000.0,
    budgetRequiredVal: 120000.0,
    execSponsor: "Dr. Eric Topol, Scripps Research Institute",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://safety-agents.company.internal",
    phase: "Harvested",
    budgetAvailabilityScore: 70.0,
    dataAvailabilityScore: 65.0,
    stakeholderReadinessScore: 75.0,
    impactOfNotDoingScore: 70.0,
    financialBusinessCaseScore: 65.0,
    budgetRequiredScore: 75.0,
    readinessScore: 70.0,
    source: "Transcript",
    sourceUrl: "",
    author: "",
    impactWorkingScore: 70.0,
    impactDevelopmentScore: 65.0,
    feasibilityScore: 75.0,
    relevancyScore: 70.0,
    agendaTimeBlock: 0,
    assignedExpertId: "",
    functionalDomain: "Campaign Measurement Intelligence",
    therapeuticAreas: ["Vaccines", "Oncology"]
  },
  {
    title: "Reinforcement Learning for Simulating Adaptive Clinical Trial Dosing Protocols",
    problemStatement: "Determining optimal therapeutic dosing schedules in clinical phases relies on rigid rules, which may miss patient-specific tolerances.",
    integrations: ["Custom APIs"],
    budgetStatus: "Pre-allocated; part of research transformation",
    stakeholderStatus: "All research directors and compliance teams aligned",
    opportunityCost: "Trial patients drop out due to dosage toxicities or experience low efficacy due to under-dosing.",
    businessCase: "Optimize dose escalations in silico based on synthetic patient bio-simulations, decreasing Phase I protocol errors by 30%.",
    dataReadiness: "Anonymized pharmacokinetic / pharmacodynamic patient logs are structured in databases.",
    financialRoi: 780000.0,
    budgetRequiredVal: 220000.0,
    execSponsor: "Dr. John Jumper, Google DeepMind",
    productOwner: "Marcus Broady, Senior Brand Manager",
    deploymentGateway: "http://adaptive-dosing.company.internal",
    phase: "Discussed",
    budgetAvailabilityScore: 85.0,
    dataAvailabilityScore: 90.0,
    stakeholderReadinessScore: 80.0,
    impactOfNotDoingScore: 85.0,
    financialBusinessCaseScore: 90.0,
    budgetRequiredScore: 80.0,
    readinessScore: 85.0,
    source: "News Feed",
    sourceUrl: "https://www.pharma-marketing-news.com/articles/reinforcement-learning-dosing-efficacy",
    author: "Phil Taylor",
    impactWorkingScore: 85.0,
    impactDevelopmentScore: 90.0,
    feasibilityScore: 80.0,
    relevancyScore: 85.0,
    agendaTimeBlock: 0,
    assignedExpertId: "",
    functionalDomain: "Field Force Automation",
    therapeuticAreas: ["Oncology", "Internal Medicine"]
  }
];

const experts = [
  {
    name: "Prof. Regina Barzilay",
    title: "Distinguished Professor of AI & Health",
    organization: "Massachusetts Institute of Technology (MIT)",
    availability: "Available",
    email: "regina.barzilay@mit.edu",
    teamsId: "regina.barzilay.teams",
    competencies: ["AI in Oncology", "De Novo Molecule Generation", "Clinical Data NLP", "Generative AI"]
  },
  {
    name: "Dr. John Jumper",
    title: "Senior Research Scientist & AlphaFold Lead",
    organization: "Google DeepMind",
    availability: "Limited",
    email: "john.jumper@deepmind.com",
    teamsId: "john.jumper.teams",
    competencies: ["Structural Biology", "Deep Learning", "AlphaFold Architecture", "Protein Synthesis"]
  },
  {
    name: "Dr. Eric Topol",
    title: "Founder & Director, Translational Institute",
    organization: "Scripps Research Institute",
    availability: "Available",
    email: "eric.topol@scripps.edu",
    teamsId: "eric.topol.teams",
    competencies: ["AI in Medicine", "Cardiology Deep Learning", "Translational Medicine", "Clinical Trial Design"]
  },
  {
    name: "Dr. Fei-Fei Li",
    title: "Professor of Computer Science & Co-Director of HAI",
    organization: "Stanford University",
    availability: "Busy",
    email: "feifeili@stanford.edu",
    teamsId: "feifeili.teams",
    competencies: ["Computer Vision in Healthcare", "Human-Centered AI", "Healthcare Robotics", "Medical Imaging Scan Evaluation"]
  }
];

async function getEmbedding(text) {
  const url = process.env.LM_STUDIO_BASE_URL ? `${process.env.LM_STUDIO_BASE_URL}/embeddings` : 'http://127.0.0.1:1234/v1/embeddings';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LOCAL_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v2-moe',
        input: text
      })
    });
    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error(`Error fetching embedding for: "${text.substring(0, 30)}..."`, err);
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

async function main() {
  console.log("Seeding started...");

  // Clean tables
  await prisma.$executeRaw`TRUNCATE "Project", "ProjectEmbedding", "Expert", "ExpertEmbedding", "MeetingIngestion", "SystemConfig", "FeedSource", "FeedItem", "ProcessedArticle" CASCADE;`;
  console.log("Cleared existing database records.");

  // Seed default feed sources
  const defaultSources = [
    {
      name: 'FiercePharma RSS Feed',
      type: 'RSS Feed',
      url: 'https://www.fiercepharma.com/rss',
      frequency: 'Daily',
      enabled: true,
      category: 'Pharma Business'
    },
    {
      name: 'AI MedTech Weekly Newsletter',
      type: 'Newsletter Extract',
      url: 'digest@aimedtech-weekly.com',
      frequency: 'Weekly',
      enabled: true,
      category: 'AI & MedTech'
    },
    {
      name: 'Pharma Dive Web Scraper',
      type: 'Website Scraper',
      url: 'https://www.pharmadive.com/digital-health',
      frequency: 'Daily',
      enabled: true,
      category: 'Digital Health'
    }
  ];

  for (const src of defaultSources) {
    await prisma.feedSource.create({
      data: src
    });
  }
  console.log("Seeded default feed sources.");


  // Seed system weights for v2 scorecard: w1, w2, w3 (Ways of Working, Ways of Development, Commercial Feasibility)
  // Default values: 0.4, 0.3, 0.3
  await prisma.systemConfig.create({
    data: {
      key: 'weights',
      value: '0.40,0.30,0.30'
    }
  });
  console.log("Seeded v2 system weights configuration (0.40, 0.30, 0.30).");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

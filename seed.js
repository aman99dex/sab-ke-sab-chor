// seed.js — Seed Neta Watch DB with real Indian MP data (public records)
// Run: node seed.js

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OFFICIALS = [
  {
    name: "Narendra Modi",
    role: "POLITICIAN", level: "NATIONAL", party: "Bharatiya Janata Party (BJP)",
    position: "Prime Minister of India", constituency: "Varanasi",
    constituencyType: "LOK_SABHA", state: "Uttar Pradesh", district: "Varanasi",
    assets: 31000000, criminalCases: 0, educationQualification: "MA Political Science (Distance)",
    websiteUrl: "https://www.narendramodi.in", termStart: "2014-05-26",
    gender: "M", age: 74, sourceUrl: "https://myneta.info",
    profilePhoto: null,
  },
  {
    name: "Rahul Gandhi",
    role: "POLITICIAN", level: "NATIONAL", party: "Indian National Congress (INC)",
    position: "Leader of Opposition (Lok Sabha)", constituency: "Wayanad",
    constituencyType: "LOK_SABHA", state: "Kerala", district: "Wayanad",
    assets: 192000000, criminalCases: 0, educationQualification: "MPhil Development Studies, Trinity College Cambridge",
    websiteUrl: "https://rahulgandhi.in", termStart: "2024-06-04",
    gender: "M", age: 54, sourceUrl: "https://myneta.info",
  },
  {
    name: "Amit Shah",
    role: "POLITICIAN", level: "NATIONAL", party: "Bharatiya Janata Party (BJP)",
    position: "Union Minister of Home Affairs", constituency: "Gandhinagar",
    constituencyType: "LOK_SABHA", state: "Gujarat", district: "Gandhinagar",
    assets: 88000000, criminalCases: 0, educationQualification: "BSc Biochemistry",
    websiteUrl: "https://amitshah.co.in", termStart: "2019-05-30",
    gender: "M", age: 59, sourceUrl: "https://myneta.info",
  },
  {
    name: "Mamata Banerjee",
    role: "POLITICIAN", level: "STATE", party: "All India Trinamool Congress (TMC)",
    position: "Chief Minister of West Bengal", constituency: "Bhowanipore",
    constituencyType: "VIDHAN_SABHA", state: "West Bengal", district: "Kolkata",
    assets: 1100000, criminalCases: 0, educationQualification: "MA, LLB",
    termStart: "2011-05-20", gender: "F", age: 69, sourceUrl: "https://trinamool.org",
  },
  {
    name: "Arvind Kejriwal",
    role: "POLITICIAN", level: "STATE", party: "Aam Aadmi Party (AAP)",
    position: "Chief Minister of Delhi", constituency: "New Delhi",
    constituencyType: "VIDHAN_SABHA", state: "Delhi", district: "New Delhi",
    assets: 5500000, criminalCases: 0, educationQualification: "BTech Mechanical Engineering, IIT Kharagpur",
    websiteUrl: "https://www.arvindkejriwal.in", termStart: "2020-02-16",
    gender: "M", age: 56, sourceUrl: "https://myneta.info",
  },
  {
    name: "Yogi Adityanath",
    role: "POLITICIAN", level: "STATE", party: "Bharatiya Janata Party (BJP)",
    position: "Chief Minister of Uttar Pradesh", constituency: "Gorakhpur Urban",
    constituencyType: "VIDHAN_SABHA", state: "Uttar Pradesh", district: "Gorakhpur",
    assets: 200000, criminalCases: 0, educationQualification: "BSc Mathematics, Garhwal University",
    termStart: "2017-03-19", gender: "M", age: 52, sourceUrl: "https://myneta.info",
  },
  {
    name: "Sonia Gandhi",
    role: "POLITICIAN", level: "NATIONAL", party: "Indian National Congress (INC)",
    position: "Member of Parliament (Rajya Sabha)", constituency: "Rajya Sabha — Congress",
    constituencyType: "RAJYA_SABHA", state: "Uttar Pradesh",
    assets: 98000000, criminalCases: 0,
    educationQualification: "Graduate, University of Cambridge",
    gender: "F", age: 77, sourceUrl: "https://myneta.info",
  },
  {
    name: "Smriti Irani",
    role: "POLITICIAN", level: "NATIONAL", party: "Bharatiya Janata Party (BJP)",
    position: "Member of Parliament (Lok Sabha)", constituency: "Amethi",
    constituencyType: "LOK_SABHA", state: "Uttar Pradesh", district: "Amethi",
    assets: 52000000, criminalCases: 0, educationQualification: "Part I BA (Commerce), Delhi University",
    gender: "F", age: 47, sourceUrl: "https://myneta.info",
  },
  {
    name: "Nirmala Sitharaman",
    role: "POLITICIAN", level: "NATIONAL", party: "Bharatiya Janata Party (BJP)",
    position: "Union Minister of Finance", constituency: "Rajya Sabha — Karnataka",
    constituencyType: "RAJYA_SABHA", state: "Karnataka",
    assets: 8800000, criminalCases: 0, educationQualification: "MA Economics, JNU",
    gender: "F", age: 64, sourceUrl: "https://myneta.info",
  },
  {
    name: "Shashi Tharoor",
    role: "POLITICIAN", level: "NATIONAL", party: "Indian National Congress (INC)",
    position: "Member of Parliament (Lok Sabha)", constituency: "Thiruvananthapuram",
    constituencyType: "LOK_SABHA", state: "Kerala", district: "Thiruvananthapuram",
    assets: 62000000, criminalCases: 1, educationQualification: "PhD, The Fletcher School, Tufts University",
    websiteUrl: "https://www.shashitharoor.in", gender: "M", age: 68, sourceUrl: "https://myneta.info",
  },
  {
    name: "Akhilesh Yadav",
    role: "POLITICIAN", level: "STATE", party: "Samajwadi Party (SP)",
    position: "Member of Parliament (Lok Sabha)", constituency: "Kannauj",
    constituencyType: "LOK_SABHA", state: "Uttar Pradesh", district: "Kannauj",
    assets: 145000000, criminalCases: 0, educationQualification: "ME Environmental Engineering, University of Sydney",
    gender: "M", age: 51, sourceUrl: "https://myneta.info",
  },
  {
    name: "Mayawati",
    role: "POLITICIAN", level: "NATIONAL", party: "Bahujan Samaj Party (BSP)",
    position: "National President, BSP", constituency: "Rajya Sabha",
    constituencyType: "RAJYA_SABHA", state: "Uttar Pradesh",
    assets: 1101000000, criminalCases: 0, educationQualification: "LLB, Delhi University",
    gender: "F", age: 68, sourceUrl: "https://myneta.info",
  },
  {
    name: "Nitish Kumar",
    role: "POLITICIAN", level: "STATE", party: "Janata Dal (United) — JDU",
    position: "Chief Minister of Bihar", constituency: "Raghopur",
    constituencyType: "VIDHAN_SABHA", state: "Bihar", district: "Vaishali",
    assets: 22000000, criminalCases: 0, educationQualification: "BSc Electrical Engineering, NIT Patna",
    termStart: "2024-01-28", gender: "M", age: 73, sourceUrl: "https://myneta.info",
  },
  {
    name: "Lalu Prasad Yadav",
    role: "POLITICIAN", level: "NATIONAL", party: "Rashtriya Janata Dal (RJD)",
    position: "Member of Parliament (Lok Sabha)", constituency: "Saran",
    constituencyType: "LOK_SABHA", state: "Bihar", district: "Saran",
    assets: 48000000, criminalCases: 4, educationQualification: "LLB, Patna University",
    gender: "M", age: 75, sourceUrl: "https://myneta.info",
  },
  {
    name: "Chandrababu Naidu",
    role: "POLITICIAN", level: "STATE", party: "Telugu Desam Party (TDP)",
    position: "Chief Minister of Andhra Pradesh", constituency: "Kuppam",
    constituencyType: "VIDHAN_SABHA", state: "Andhra Pradesh", district: "Chittoor",
    assets: 831000000, criminalCases: 1, educationQualification: "MA Economics, Tirupati University",
    termStart: "2024-06-12", gender: "M", age: 74, sourceUrl: "https://myneta.info",
  },
  {
    name: "M.K. Stalin",
    role: "POLITICIAN", level: "STATE", party: "Dravida Munnetra Kazhagam (DMK)",
    position: "Chief Minister of Tamil Nadu", constituency: "Kolathur",
    constituencyType: "VIDHAN_SABHA", state: "Tamil Nadu", district: "Chennai",
    assets: 98000000, criminalCases: 0, educationQualification: "BA History",
    termStart: "2021-05-07", gender: "M", age: 70, sourceUrl: "https://myneta.info",
  },
  {
    name: "Pinarayi Vijayan",
    role: "POLITICIAN", level: "STATE", party: "Communist Party of India (Marxist) — CPI(M)",
    position: "Chief Minister of Kerala", constituency: "Dharmadom",
    constituencyType: "VIDHAN_SABHA", state: "Kerala", district: "Kannur",
    assets: 24000000, criminalCases: 0,
    termStart: "2021-05-20", gender: "M", age: 78, sourceUrl: "https://myneta.info",
  },
  {
    name: "Hemant Soren",
    role: "POLITICIAN", level: "STATE", party: "Jharkhand Mukti Morcha (JMM)",
    position: "Chief Minister of Jharkhand", constituency: "Barhait",
    constituencyType: "VIDHAN_SABHA", state: "Jharkhand", district: "Sahebganj",
    assets: 32000000, criminalCases: 1,
    termStart: "2024-11-28", gender: "M", age: 49, sourceUrl: "https://myneta.info",
  },
  {
    name: "Ashok Gehlot",
    role: "POLITICIAN", level: "STATE", party: "Indian National Congress (INC)",
    position: "Member of Parliament (Lok Sabha)", constituency: "Jodhpur",
    constituencyType: "LOK_SABHA", state: "Rajasthan", district: "Jodhpur",
    assets: 72000000, criminalCases: 0, educationQualification: "MA Economics, Jodhpur University",
    gender: "M", age: 73, sourceUrl: "https://myneta.info",
  },
  {
    name: "Supriya Sule",
    role: "POLITICIAN", level: "NATIONAL", party: "Nationalist Congress Party — Sharadchandra Pawar (NCP-SP)",
    position: "Member of Parliament (Lok Sabha)", constituency: "Baramati",
    constituencyType: "LOK_SABHA", state: "Maharashtra", district: "Pune",
    assets: 240000000, criminalCases: 0,
    gender: "F", age: 54, sourceUrl: "https://myneta.info",
  },
];

const ALLEGATIONS_DATA = [
  {
    officialName: "Lalu Prasad Yadav",
    allegations: [
      {
        title: "Fodder Scam Conviction",
        description: "Convicted in the infamous Bihar fodder scam involving fraudulent withdrawal of ₹950 crore from state animal husbandry department funds.",
        severity: "CRITICAL",
        status: "VERIFIED",
        sourceUrl: "https://en.wikipedia.org/wiki/Bihar_fodder_scam",
      },
      {
        title: "Land-for-Job Scam Investigation",
        description: "CBI investigation into alleged quid pro quo where railway jobs were given in exchange for land transfers to family members during his tenure as Railway Minister.",
        severity: "HIGH",
        status: "INVESTIGATING",
      },
    ],
  },
  {
    officialName: "Hemant Soren",
    allegations: [
      {
        title: "Mining Lease Controversy",
        description: "Alleged illegal grant of a stone mining lease to himself while holding office as Chief Minister of Jharkhand, violating the Representation of the People Act.",
        severity: "HIGH",
        status: "INVESTIGATING",
        sourceUrl: "https://indianexpress.com",
      },
    ],
  },
  {
    officialName: "Chandrababu Naidu",
    allegations: [
      {
        title: "Skill Development Scam",
        description: "CID investigation into alleged ₹3,300 crore fraud in the Skill Development Corporation of Andhra Pradesh during his previous tenure.",
        severity: "HIGH",
        status: "INVESTIGATING",
      },
    ],
  },
  {
    officialName: "Shashi Tharoor",
    allegations: [
      {
        title: "Sunanda Pushkar Death Case",
        description: "Delhi Police filed chargesheet alleging abetment of suicide/culpable homicide related to the death of his wife Sunanda Pushkar in January 2014.",
        severity: "HIGH",
        status: "INVESTIGATING",
        sourceUrl: "https://en.wikipedia.org/wiki/Sunanda_Pushkar",
      },
    ],
  },
  {
    officialName: "Arvind Kejriwal",
    allegations: [
      {
        title: "Delhi Liquor Policy Case",
        description: "ED and CBI arrested Kejriwal alleging role in the Delhi excise policy scam. Released on bail by Supreme Court in September 2024. Resigned as CM thereafter.",
        severity: "HIGH",
        status: "INVESTIGATING",
        sourceUrl: "https://en.wikipedia.org/wiki/Delhi_liquor_policy_case",
      },
    ],
  },
];

const PROMISES_DATA = [
  {
    officialName: "Narendra Modi",
    promises: [
      {
        title: "2 Crore Jobs Per Year",
        description: "Promise made in 2014 manifesto to create 2 crore employment opportunities annually.",
        status: "IN_PROGRESS",
        budgetAllotted: null,
        deadline: "2019-05-23",
      },
      {
        title: "PM Awas Yojana — 2 Crore Houses",
        description: "Construct 2 crore affordable housing units under Pradhan Mantri Awas Yojana for urban poor.",
        status: "IN_PROGRESS",
        budgetAllotted: 250000000000,
        budgetSpent: 189000000000,
        deadline: "2024-12-31",
      },
      {
        title: "Har Ghar Jal — Piped Water to All Homes",
        description: "Jal Jeevan Mission: provide functional household tap connections to all 19 crore rural homes.",
        status: "IN_PROGRESS",
        budgetAllotted: 600000000000,
        budgetSpent: 487000000000,
        deadline: "2024-12-31",
        sourceUrl: "https://jaljeevanjal.nic.in",
      },
    ],
  },
  {
    officialName: "Arvind Kejriwal",
    promises: [
      {
        title: "Free 200 Units Electricity per Month",
        description: "Delhi government to provide 200 units of electricity free to every household monthly.",
        status: "COMPLETED",
        budgetAllotted: 38000000000,
        budgetSpent: 36000000000,
        sourceUrl: "https://mohua.gov.in",
      },
      {
        title: "Free Water Supply (20KL per Month)",
        description: "Provide 20,000 litres of free water per month to every Delhi household.",
        status: "COMPLETED",
        budgetAllotted: 12000000000,
        budgetSpent: 11500000000,
      },
      {
        title: "Mohalla Clinics — Primary Healthcare",
        description: "Set up 1,000 Aam Aadmi Clinics providing free primary healthcare, medicines, and diagnostics.",
        status: "IN_PROGRESS",
        budgetAllotted: 10000000000,
        budgetSpent: 7800000000,
      },
    ],
  },
  {
    officialName: "M.K. Stalin",
    promises: [
      {
        title: "Kalaignar Magalir Urimai Thogai — ₹1000/month Women",
        description: "Monthly financial assistance of ₹1,000 to heads of women-led families.",
        status: "COMPLETED",
        budgetAllotted: 70000000000,
        budgetSpent: 68000000000,
        deadline: "2026-05-31",
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data
  await prisma.newsArticleOfficial.deleteMany();
  await prisma.whistleblowerReportOfficial.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.allegation.deleteMany();
  await prisma.promise.deleteMany();
  await prisma.assetDeclaration.deleteMany();
  await prisma.courtCase.deleteMany();
  await prisma.fIR.deleteMany();
  await prisma.official.deleteMany();
  console.log("✅ Cleared existing data\n");

  // Seed officials
  const created = {};
  for (const data of OFFICIALS) {
    const { profilePhoto, ...rest } = data;
    const official = await prisma.official.create({ data: rest });
    created[data.name] = official.id;
    console.log(`  ✓ Created official: ${data.name}`);
  }

  console.log(`\n✅ Created ${OFFICIALS.length} officials\n`);

  // Seed allegations
  for (const { officialName, allegations } of ALLEGATIONS_DATA) {
    const officialId = created[officialName];
    if (!officialId) { console.warn(`  ⚠ Official not found: ${officialName}`); continue; }
    for (const a of allegations) {
      await prisma.allegation.create({ data: { officialId, ...a } });
      console.log(`  ✓ Allegation: "${a.title}" → ${officialName}`);
    }
  }

  console.log("\n✅ Seeded allegations\n");

  // Seed promises
  for (const { officialName, promises } of PROMISES_DATA) {
    const officialId = created[officialName];
    if (!officialId) { console.warn(`  ⚠ Official not found: ${officialName}`); continue; }
    for (const p of promises) {
      await prisma.promise.create({ data: { officialId, ...p } });
      console.log(`  ✓ Promise: "${p.title}" → ${officialName}`);
    }
  }

  console.log("\n✅ Seeded promises\n");

  // Seed sample asset declarations
  const modiId = created["Narendra Modi"];
  const rahulId = created["Rahul Gandhi"];

  if (modiId) {
    await prisma.assetDeclaration.create({
      data: {
        officialId: modiId, year: 2024, electionType: "LOK_SABHA",
        movableAssets: 28200000, immovableAssets: 2800000, totalAssets: 31000000, liabilities: 0,
        sourceUrl: "https://affidavit.eci.gov.in",
      },
    });
  }

  if (rahulId) {
    await prisma.assetDeclaration.create({
      data: {
        officialId: rahulId, year: 2024, electionType: "LOK_SABHA",
        movableAssets: 182000000, immovableAssets: 10000000, totalAssets: 192000000, liabilities: 0,
        sourceUrl: "https://affidavit.eci.gov.in",
      },
    });
  }

  // Seed court cases
  const laluId = created["Lalu Prasad Yadav"];
  if (laluId) {
    await prisma.courtCase.create({
      data: {
        officialId: laluId,
        caseNumber: "RC 20(A)/96",
        court: "CBI Special Court, Ranchi",
        caseType: "CRIMINAL",
        status: "CONVICTED",
        charges: JSON.stringify(["Criminal Conspiracy", "Cheating", "Forgery", "Prevention of Corruption Act"]),
        filingDate: "1996-08-01",
        judgment: "Convicted on 23 December 2017. Sentenced to 3.5 years of rigorous imprisonment.",
        judgmentSummary: "Convicted in the Chaibasa Treasury case, one of four fodder scam cases. Sentenced to 3.5 years RI and fined.",
        source: "MANUAL",
        sourceUrl: "https://en.wikipedia.org/wiki/Bihar_fodder_scam",
      },
    });
  }

  const hemantId = created["Hemant Soren"];
  if (hemantId) {
    await prisma.courtCase.create({
      data: {
        officialId: hemantId,
        caseNumber: "PMLA/RC/2024/CG0001",
        court: "Special PMLA Court, Ranchi",
        caseType: "CRIMINAL",
        status: "HEARING",
        charges: JSON.stringify(["Prevention of Money Laundering Act (PMLA)", "Illegal Mining"]),
        filingDate: "2024-01-31",
        source: "MANUAL",
        sourceUrl: "https://timesofindia.indiatimes.com",
      },
    });
  }

  console.log("✅ Seeded court cases and asset declarations\n");

  const stats = await prisma.official.count();
  const allegationCount = await prisma.allegation.count();
  const promiseCount = await prisma.promise.count();

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Officials: ${stats}`);
  console.log(`   Allegations: ${allegationCount}`);
  console.log(`   Promises: ${promiseCount}`);

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

// aiVerifier.js — Tiered AI claim verification (ALL FREE)
// Tier 1: Groq Llama 3 (1,000 req/day free) — primary verifier
// Tier 2: HuggingFace BART-MNLI (1,000 req/day free) — fallback classifier
// Tier 3: Keyword-based offline analysis — last resort

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Free tier

const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const HF_TOKEN = process.env.HF_TOKEN || null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

// ─── TIER 1: Groq Llama 3 Verification ───

async function verifyWithGroq(claimTitle, claimDescription, officialName) {
  if (!GROQ_API_KEY) return null;

  const systemPrompt = `You are an AI fact-checker for Indian political claims. Analyze the claim and respond ONLY with valid JSON:
{
  "verdict": "VERIFIED" | "LIKELY_FALSE" | "UNVERIFIABLE",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "suggestedSources": ["list of sources to check"]
}

Rules:
- Be skeptical. Default to UNVERIFIABLE if insufficient evidence.
- VERIFIED = strong evidence supports the claim
- LIKELY_FALSE = contradicting evidence or known misinformation patterns
- UNVERIFIABLE = cannot determine truth without official records
- Consider Indian legal/political context`;

  const userPrompt = `Claim about ${officialName}: "${claimTitle}"
Description: ${claimDescription}

Analyze this claim about an Indian government official.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[AI-Groq] API error ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const verdictMap = { VERIFIED: "VERIFIED", LIKELY_FALSE: "REJECTED", UNVERIFIABLE: "PENDING" };

    return {
      label: parsed.verdict || "UNVERIFIABLE",
      claimStatus: verdictMap[parsed.verdict] || "PENDING",
      confidence: parsed.confidence || 50,
      note: `🤖 Groq Llama 3 (${parsed.confidence}% confidence): ${parsed.reasoning || "Analysis complete."}${parsed.suggestedSources?.length ? ` Sources to check: ${parsed.suggestedSources.join(", ")}` : ""}`,
      model: "groq/llama-3.3-70b",
    };
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("[AI-Groq] Request timed out.");
    } else {
      console.warn(`[AI-Groq] Error: ${err.message}`);
    }
    return null;
  }
}

// ─── TIER 2: HuggingFace BART-MNLI Classification ───

const CANDIDATE_LABELS = [
  "factually verified with evidence",
  "likely false or misleading",
  "unverifiable without official records",
];

async function verifyWithHuggingFace(claimTitle, claimDescription, officialName) {
  const inputText = `Claim about ${officialName}: ${claimTitle}. ${claimDescription}`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          candidate_labels: CANDIDATE_LABELS,
          hypothesis_template: "This claim about an Indian government official is {}.",
          multi_label: false,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const result = await response.json();
    if (result.error) return null;

    const topIdx = result.scores.indexOf(Math.max(...result.scores));
    const topLabel = result.labels[topIdx];
    const topScore = result.scores[topIdx];

    const labelMap = {
      "factually verified with evidence": "VERIFIED",
      "likely false or misleading": "LIKELY_FALSE",
      "unverifiable without official records": "UNVERIFIABLE",
    };
    const statusMap = {
      "factually verified with evidence": "VERIFIED",
      "likely false or misleading": "REJECTED",
      "unverifiable without official records": "PENDING",
    };

    const pct = (s) => Math.round(s * 100);

    return {
      label: labelMap[topLabel] || "UNVERIFIABLE",
      claimStatus: statusMap[topLabel] || "PENDING",
      confidence: pct(topScore),
      note: `🤖 HuggingFace BART (${pct(topScore)}% confidence): "${topLabel}". [V:${pct(result.scores[0])}% | F:${pct(result.scores[1])}% | U:${pct(result.scores[2])}%]`,
      model: "huggingface/bart-large-mnli",
    };
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn(`[AI-HF] Error: ${err.message}`);
    }
    return null;
  }
}

// ─── TIER 3: Keyword-Based Offline Fallback ───

function fallbackVerification(title, description) {
  const text = (title + " " + description).toLowerCase();

  const verifiedKeywords = [
    "proof", "document", "rti", "official record", "court", "judgment",
    "affidavit", "gazette", "confirmed", "audit report", "cbi", "ed",
    "chargesheet", "fir", "evidence", "investigation",
  ];
  const falseKeywords = [
    "rumor", "i heard", "somebody said", "allegedly", "unconfirmed",
    "hearsay", "whatsapp forward", "social media claim", "fake",
  ];

  const vScore = verifiedKeywords.filter((k) => text.includes(k)).length;
  const fScore = falseKeywords.filter((k) => text.includes(k)).length;

  if (vScore >= 2 && vScore > fScore) {
    return {
      label: "VERIFIED",
      claimStatus: "VERIFIED",
      confidence: 52,
      note: "Claim contains verifiable evidence indicators (offline analysis). Manual review recommended.",
      model: "offline/keyword-analysis",
    };
  }
  if (fScore > vScore) {
    return {
      label: "LIKELY_FALSE",
      claimStatus: "REJECTED",
      confidence: 45,
      note: "Claim contains uncertainty indicators (offline analysis). Manual review recommended.",
      model: "offline/keyword-analysis",
    };
  }
  return {
    label: "UNVERIFIABLE",
    claimStatus: "PENDING",
    confidence: 25,
    note: "AI verification unavailable. Claim queued for manual review.",
    model: "offline/keyword-analysis",
  };
}

// ─── MAIN: Tiered Verification ───

export async function verifyClaim(claimTitle, claimDescription, officialName) {
  // Try Tier 1: Groq Llama 3
  const groqResult = await verifyWithGroq(claimTitle, claimDescription, officialName);
  if (groqResult) {
    console.log(`[AI] Verified via Groq Llama 3 (${groqResult.confidence}% confidence)`);
    return groqResult;
  }

  // Try Tier 2: HuggingFace BART
  const hfResult = await verifyWithHuggingFace(claimTitle, claimDescription, officialName);
  if (hfResult) {
    console.log(`[AI] Verified via HuggingFace BART (${hfResult.confidence}% confidence)`);
    return hfResult;
  }

  // Tier 3: Offline fallback
  console.log("[AI] All API models unavailable, using offline keyword analysis.");
  return fallbackVerification(claimTitle, claimDescription);
}

// ─── BONUS: Gemini Flash Data Extraction (for scraper use) ───

export async function extractWithGemini(htmlContent, extractionPrompt) {
  if (!GEMINI_API_KEY) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${extractionPrompt}\n\nHTML Content:\n${htmlContent.substring(0, 30000)}`,
            }],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn(`[AI-Gemini] Error: ${err.message}`);
    return null;
  }
}

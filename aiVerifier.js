// aiVerifier.js — AI claim verification using HuggingFace Inference API (free tier)
// Model: facebook/bart-large-mnli (zero-shot classification)
// No API key required for ~1k requests/day. Set HF_TOKEN env var for higher limits.

const HF_API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const HF_TOKEN = process.env.HF_TOKEN || null;

const CANDIDATE_LABELS = [
  "factually verified with evidence",
  "likely false or misleading",
  "unverifiable without official records",
];

export async function verifyClaim(claimTitle, claimDescription, officialName) {
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
          hypothesis_template:
            "This claim about an Indian government official is {}.",
          multi_label: false,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn("[AI Verifier] API error:", response.status, errText);
      return fallbackVerification(claimTitle, claimDescription);
    }

    const result = await response.json();

    // Model may still be loading
    if (result.error) {
      console.warn("[AI Verifier] Model loading:", result.error);
      return {
        label: "UNVERIFIABLE",
        claimStatus: "PENDING",
        confidence: 0,
        note: "AI model is warming up. Claim queued for manual review. Please retry in ~30 seconds.",
      };
    }

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
      note: `🤖 AI Analysis (${pct(topScore)}% confidence): This claim appears "${topLabel}". ` +
        `[Verified: ${pct(result.scores[0])}% | False: ${pct(result.scores[1])}% | Unverifiable: ${pct(result.scores[2])}%] ` +
        `Model: facebook/bart-large-mnli via HuggingFace Inference API.`,
    };
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("[AI Verifier] Request timed out.");
      return {
        label: "UNVERIFIABLE",
        claimStatus: "PENDING",
        confidence: 0,
        note: "AI verification timed out. Claim queued for manual review.",
      };
    }
    console.warn("[AI Verifier] Error:", err.message);
    return fallbackVerification(claimTitle, claimDescription);
  }
}

function fallbackVerification(title, description) {
  const text = (title + " " + description).toLowerCase();

  const verifiedKeywords = [
    "proof", "document", "rti", "official record", "court", "judgment",
    "affidavit", "gazette", "confirmed", "audit report", "cbi", "ed",
  ];
  const falseKeywords = [
    "rumor", "i heard", "somebody said", "allegedly", "unconfirmed",
    "hearsay", "whatsapp forward", "social media claim",
  ];

  const vScore = verifiedKeywords.filter((k) => text.includes(k)).length;
  const fScore = falseKeywords.filter((k) => text.includes(k)).length;

  if (vScore >= 2 && vScore > fScore) {
    return {
      label: "VERIFIED",
      claimStatus: "VERIFIED",
      confidence: 52,
      note: "Claim contains verifiable evidence indicators (offline analysis). Manual review recommended.",
    };
  }
  if (fScore > vScore) {
    return {
      label: "LIKELY_FALSE",
      claimStatus: "REJECTED",
      confidence: 45,
      note: "Claim contains uncertainty indicators (offline analysis). Manual review recommended.",
    };
  }
  return {
    label: "UNVERIFIABLE",
    claimStatus: "PENDING",
    confidence: 25,
    note: "AI verification temporarily unavailable. Claim queued for manual review.",
  };
}

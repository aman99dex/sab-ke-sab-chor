import { verifyClaim } from "./aiVerifier.js";
import { getPersonProfile, searchPeopleGlobal } from "./externalIntel.js";
import { enqueueScrapeJob } from "./scrapeQueue.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function runGroqTask(taskType, payload) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const prompt = `You are assisting an anti-corruption civic-tech platform in India.
Task type: ${taskType}
Payload JSON: ${JSON.stringify(payload)}

Return strict JSON with these keys:
- summary: short paragraph
- actionItems: array of concrete next actions
- riskFlags: array of caveats and reliability concerns`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Respond only with JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function runAgentTask(taskType, payload = {}) {
  const normalizedTask = String(taskType || "").trim().toUpperCase();

  if (normalizedTask === "VERIFY_CLAIM") {
    const claimTitle = payload.claimTitle || "Untitled claim";
    const claimDescription = payload.claimDescription || "";
    const officialName = payload.officialName || "Unknown official";
    const verification = await verifyClaim(claimTitle, claimDescription, officialName);

    return {
      taskType: normalizedTask,
      status: "ok",
      result: verification,
      model: verification.model,
      timestamp: new Date().toISOString(),
    };
  }

  if (normalizedTask === "GLOBAL_PERSON_RESEARCH") {
    const name = payload.name || payload.query;
    if (!name) {
      return { taskType: normalizedTask, status: "error", error: "Missing payload.name" };
    }

    const [profile, webMentions, aiBrief] = await Promise.all([
      getPersonProfile(name),
      searchPeopleGlobal(name, { limit: 8 }),
      runGroqTask(normalizedTask, payload),
    ]);

    return {
      taskType: normalizedTask,
      status: "ok",
      result: {
        profile,
        webMentions,
        aiBrief,
      },
      timestamp: new Date().toISOString(),
    };
  }

  if (normalizedTask === "SCRAPE_STRATEGY") {
    const topic = payload.topic || payload.query || "indian officials corruption datasets";
    const mentions = await searchPeopleGlobal(topic, { limit: 8 });
    const aiBrief = await runGroqTask(normalizedTask, {
      topic,
      availableSources: ["INDIAN_KANOON", "DATA_GOV", "MYNETA", "SANSAD", "GNEWS"],
      mentions,
    });

    return {
      taskType: normalizedTask,
      status: "ok",
      result: {
        topic,
        mentions,
        aiBrief,
      },
      timestamp: new Date().toISOString(),
    };
  }

  if (normalizedTask === "QUEUE_SCRAPE_JOB") {
    const officialId = payload.officialId ? String(payload.officialId).trim() : null;
    const type = officialId ? "OFFICIAL_NEWS_SCRAPE" : "FULL_NEWS_SCRAPE";
    const queuedJob = enqueueScrapeJob({ type, officialId });

    return {
      taskType: normalizedTask,
      status: "ok",
      result: queuedJob,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    taskType: normalizedTask,
    status: "error",
    error: `Unsupported taskType: ${normalizedTask}`,
    supportedTaskTypes: ["VERIFY_CLAIM", "GLOBAL_PERSON_RESEARCH", "SCRAPE_STRATEGY", "QUEUE_SCRAPE_JOB"],
  };
}

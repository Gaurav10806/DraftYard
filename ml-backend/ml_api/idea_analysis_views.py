"""
Real AI-generated analysis of a submitted idea, using Google Gemini.

Used mainly for the case where idea_match_views finds zero (or very
few) similar drafts — there's no DraftYard community data to lean on,
so instead we ask an actual LLM to reason about the idea directly:
feasibility, competition, complexity, market opportunity, and concrete
recommendations.

Requires GEMINI_API_KEY in ml-backend/.env (get one free at
https://aistudio.google.com/apikey). Never commit this key — .env is
already gitignored.
"""
import json
import os
import re

import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response

def _call_gemini_with_fallback(prompt: str, api_key: str, max_tokens: int = 4096):
    """
    Dynamically queries available Gemini models and falls back through them.
    """

    # Preferred models (best -> fallback)
    candidates = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    ]

    # Discover models available for this API key
    try:
        models_resp = requests.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            timeout=10,
        )

        if models_resp.status_code == 200:
            available = [
                m["name"].replace("models/", "")
                for m in models_resp.json().get("models", [])
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]

            if available:
                candidates = (
                    [m for m in candidates if m in available]
                    + [m for m in available if m not in candidates]
                )

            print(f"[Gemini Helper] Available models: {candidates}")

        else:
            print(
                f"[Gemini Helper] Failed to list models ({models_resp.status_code})"
            )

    except Exception as e:
        print(f"[Gemini Helper] Failed to list models: {e}")

    last_err = ""

    for model_name in candidates:

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent?key={api_key}"
        )

        try:
            r = requests.post(
                url,
                headers={
                    "Content-Type": "application/json",
                },
                json={
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                   "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 1024,
    "responseMimeType": "application/json",
     "thinkingConfig": {
        "thinkingBudget": 0
    }
},
                },
                timeout=30,
            )

            print(f"[Gemini Helper] Model '{model_name}' -> HTTP {r.status_code}")
            print(f"\n[Gemini] Model: {model_name}")
            print(f"[Gemini] Status: {r.status_code}")
            print(r.text)

            if r.status_code == 200:
                return r, None

            print(f"[Gemini Helper] Response: {r.text}")

            last_err = (
                f"[{model_name} HTTP {r.status_code}] "
                f"{r.text}"
            )

        except requests.RequestException as exc:
            last_err = f"[{model_name} EXCEPTION] {exc}"
            print(last_err)

    return None, last_err
PROMPT_TEMPLATE = """You are a pragmatic startup/software-project advisor reviewing a student's project idea.

Project name: {project_name}
One-line pitch: {pitch}
Additional context: {context}

Respond with ONLY a single valid JSON object (no markdown fences, no commentary before or after) matching exactly this shape:

{{
  "score": <integer 0-100>,
  "verdict": <"Worth Building" | "Needs Refinement" | "Reconsider">,
  "summary": <maximum 50 words>,
  "strengths": [
    <3 concise points>
  ],
  "weaknesses": [
    <3 concise points>
  ],
  "recommendations": [
    <3 concise action items>
  ],
  "techStack": {{
    "frontend": "",
    "backend": "",
    "database": "",
    "ai": ""
}}
}}

Be honest and specific to THIS idea.

Keep the entire response under 350 words.

Summary must be under 30 words.

Each note must be under 15 words.

Recommendations: exactly 3 short bullet points.

Roadmap: exactly 3 milestones.

Return ONLY valid JSON.  
"""


def _extract_json(text: str) -> dict:
    """Gemini is asked for raw JSON, but strip markdown fences defensively
    in case it wraps the response anyway."""
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    return json.loads(cleaned)


@api_view(["POST"])
def idea_analysis(request):
    """
    POST body: { "projectName"?: str, "pitch": str, "context": str }
    Returns a real LLM-generated analysis of the idea (see PROMPT_TEMPLATE
    for the exact shape returned).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return Response(
            {"error": "GEMINI_API_KEY is not set. Add it to ml-backend/.env."},
            status=500,
        )

    project_name = (request.data.get("projectName") or "Untitled Idea").strip()
    pitch = (request.data.get("pitch") or "").strip()
    context = (request.data.get("context") or "").strip()

    if not pitch and not context:
        return Response(
            {"error": "Provide at least a 'pitch' or 'context' describing the idea."},
            status=400,
        )

    prompt = PROMPT_TEMPLATE.format(project_name=project_name, pitch=pitch, context=context)

    resp, error_text = _call_gemini_with_fallback(prompt, api_key)

    if not resp:
        return Response(
            {"error": f"Gemini API error: {error_text[:500]}"},
            status=502,
        )

    data = resp.json()
    try:
        candidate = data["candidates"][0]
        finish_reason = candidate.get("finishReason")
        raw_text = candidate["content"]["parts"][0]["text"]
        print("\n========== RAW MODEL OUTPUT ==========")
        print(raw_text)
        print("======================================\n")
    except (KeyError, IndexError) as exc:
        return Response(
            {"error": f"Unexpected Gemini response shape: {exc}"},
            status=502,
        )

    if finish_reason == "MAX_TOKENS":
        return Response(
            {"error": "Gemini's response was cut off (hit the token limit) before finishing the JSON."},
            status=502,
        )

    try:
        analysis = _extract_json(raw_text)
    except json.JSONDecodeError as exc:
        return Response(
            {"error": f"Couldn't parse Gemini's response: {exc}"},
            status=502,
        )

    return Response({"analysis": analysis})
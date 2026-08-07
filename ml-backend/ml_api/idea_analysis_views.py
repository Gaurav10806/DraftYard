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

def _call_gemini_with_fallback(prompt: str, api_key: str, max_tokens: int = 2048):
    """
    Dynamically queries available models from Gemini API for the API key,
    or falls back through standard names, preventing 404 and 429 quota errors.
    """
    # Preferred models order
    candidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    
    # Try fetching real available models for this specific API key
    try:
        models_resp = requests.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            timeout=5
        )
        if models_resp.status_code == 200:
            available = [
                m["name"].replace("models/", "")
                for m in models_resp.json().get("models", [])
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]
            if available:
                # Intersect candidate list with actual available models for this key
                valid_candidates = [m for m in candidates if m in available] + [m for m in available if m not in candidates]
                candidates = valid_candidates
    except Exception as e:
        print(f"[Gemini Helper] Failed to list models: {e}")

    last_err = ""
    for model_name in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        try:
            r = requests.post(
                url,
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": max_tokens},
                },
                timeout=25,
            )
            print(f"[Gemini Helper] Model '{model_name}' -> HTTP {r.status_code}")
            if r.status_code == 200:
                return r, None
            else:
                last_err = f"[{model_name} HTTP {r.status_code}]: {r.text}"
        except requests.RequestException as exc:
            last_err = f"[{model_name} EXCEPTION]: {exc}"

    return None, last_err

PROMPT_TEMPLATE = """You are a pragmatic startup/software-project advisor reviewing a student's project idea.

Project name: {project_name}
One-line pitch: {pitch}
Additional context: {context}

Respond with ONLY a single valid JSON object (no markdown fences, no commentary before or after) matching exactly this shape:

{{
  "score": <integer 0-100, overall viability>,
  "verdict": <one of "Worth Building", "Needs Refinement", "Reconsider">,
  "summary": <1-2 sentence honest summary>,
  "feasibility": {{"label": <"High"|"Medium"|"Low">, "note": <one short sentence>}},
  "competition": {{"label": <"High"|"Medium"|"Low">, "note": <one short sentence>}},
  "complexity": {{"label": <"High"|"Medium"|"Low">, "note": <one short sentence>}},
  "scalability": {{"label": <"High"|"Medium"|"Low">, "note": <one short sentence>}},
  "market": {{"headline": <very short market-size or opportunity phrase>, "note": <one short sentence>}},
  "recommendations": [<3-5 short, concrete, actionable instruction strings that directly reference the pitch and context>],
  "techStack": {{"frontend": <string>, "backend": <string>, "database": <string>, "ai": <string>, "hosting": <string>}},
  "roadmap": [{{"week": <e.g. "Week 1">, "label": <short milestone>}}, ... 5-7 items covering research through launch],
  "finalNote": <1-2 sentence closing recommendation>
}}

Be honest and specific to THIS idea, not generic. If the idea is weak or overdone, say so plainly rather than being falsely encouraging.
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
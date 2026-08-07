import os
import re
import json
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

PROMPT_TEMPLATE = """You are a helpful and intelligent AI Assistant for a developer working on a project in DraftYard.
Use the following context about their project to provide relevant, specific, and actionable advice.
Be concise but extremely helpful. Answer in markdown if needed.

Project Context:
{context}
"""

BANNED_LEAK_PATTERNS = [
    r"^\s*Role\s*:\s*",
    r"^\s*Task\s*:\s*",
    r"^\s*Constraint\s*:\s*",
    r"^\s*Self-Correction\s*:\s*",
    r"^\s*Internal Monologue\s*:\s*",
    r"^\s*Draft\s*\d*\s*:\s*",
    r"^\s*Reasoning\s*:\s*",
    r"^\s*Thought\s*:\s*",
    r"^\s*Planning\s*:\s*",
    r"^\s*Prompt\s*:\s*",
    r"^\s*Instructions\s*:\s*",
]

def parse_gemini_candidate_parts(candidate: dict) -> str:
    """
    Extracts ONLY final user-facing text parts from Gemini candidate.
    Filters out any thinking/reasoning parts (e.g. thought: true or thinking_config outputs).
    """
    content = candidate.get("content", {})
    parts = content.get("parts", [])
    if not parts:
        return ""

    final_parts = []
    for part in parts:
        # Ignore parts designated as internal thoughts or reasoning
        if part.get("thought") is True or "thought" in part:
            continue
        text = part.get("text", "")
        if text:
            final_parts.append(text)

    # Fallback to last part if all were filtered
    if not final_parts and parts:
        final_parts = [parts[-1].get("text", "")]

    return "\n".join(final_parts).strip()


def sanitize_ai_response(text: str) -> str:
    """
    Backend safeguard removing internal monologues, reasoning traces,
    prompt leakage, or evaluation notes from Gemini outputs.
    """
    if not text:
        return ""

    cleaned = text.strip()

    # If the response contains JSON markdown blocks or raw JSON object, attempt to parse `rewritten`
    json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", cleaned, re.IGNORECASE)
    if json_match:
        raw_json = json_match.group(1)
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, dict) and "rewritten" in parsed and isinstance(parsed["rewritten"], str):
                cleaned = parsed["rewritten"].strip()
        except Exception:
            pass
    elif cleaned.startswith("{") and cleaned.endswith("}"):
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and "rewritten" in parsed and isinstance(parsed["rewritten"], str):
                cleaned = parsed["rewritten"].strip()
        except Exception:
            pass

    # Strip reasoning headers line-by-line
    lines = cleaned.split("\n")
    filtered_lines = []

    for line in lines:
        stripped_line = line.strip()
        if any(re.match(pattern, stripped_line, re.IGNORECASE) for pattern in BANNED_LEAK_PATTERNS):
            continue
        filtered_lines.append(line)

    final_text = "\n".join(filtered_lines).strip()
    final_text = re.sub(r"^```(?:json)?", "", final_text, flags=re.IGNORECASE).replace("```", "").strip()
    return final_text


@api_view(["POST"])
def chat(request):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return Response({"error": "GEMINI_API_KEY is not set."}, status=500)
        
    context = request.data.get("context", "")
    history = request.data.get("history", [])
    message = request.data.get("message", "")
    
    if not message:
        return Response({"error": "Message is required"}, status=400)
        
    system_prompt = PROMPT_TEMPLATE.format(context=context or "No context provided.")
    
    # Concatenate history for stateless response
    full_prompt = "Conversation History:\n"
    if history:
        for msg in history:
            role_label = "User" if msg.get("role") == "user" else "Assistant"
            full_prompt += f"{role_label}: {msg.get('content', '')}\n"
        
    full_prompt += f"\nUser: {message}\nAssistant:"
    
    from .idea_analysis_views import _call_gemini_with_fallback

    resp, error_text = _call_gemini_with_fallback(system_prompt + "\n\n" + full_prompt, api_key, max_tokens=1024)

    if not resp:
        return Response({"error": f"Gemini API error: {error_text[:500]}"}, status=502)
        
    data = resp.json()

    # Log the complete Gemini API response object for backend verification
    print(f"[Gemini Response Debug]: {json.dumps(data, indent=2)}")

    try:
        candidate = data["candidates"][0]
        # Extract ONLY final user-facing text part, ignoring thoughts
        response_text = parse_gemini_candidate_parts(candidate)
    except (KeyError, IndexError) as exc:
        return Response({"error": f"Unexpected Gemini response shape: {exc}"}, status=502)

    # Apply backend sanitization safeguard
    sanitized_output = sanitize_ai_response(response_text)
        
    return Response({"response": sanitized_output})

import os
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
    try:
        response_text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        return Response({"error": f"Unexpected Gemini response shape: {exc}"}, status=502)
        
    return Response({"response": response_text})

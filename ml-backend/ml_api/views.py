from rest_framework.decorators import api_view
from rest_framework.response import Response
from .classifier import classify_burials


@api_view(["POST"])
def classify(request):
    """
    Expects: { "burials": [{ "id": "...", "whyItDied": "..." }, ...] }
    Returns: [{ "id": "...", "deathCategory": "..." }, ...]
    """
    burials = request.data.get("burials", [])
    if not burials:
        return Response({"error": "No burials provided"}, status=400)

    texts = [b.get("whyItDied", "") for b in burials]
    labels = classify_burials(texts)

    result = [
        {"id": burials[i].get("id"), "deathCategory": labels[i]}
        for i in range(len(burials))
    ]
    return Response(result)
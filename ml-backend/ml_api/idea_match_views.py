import re
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .mongo_utils import get_burials_collection, get_workspaces_collection
from .rag_services import (
    RetrievalService,
    ReRankingService,
    PromptBuilder,
    LLMGenerationService,
    AnalyticsService
)

MAX_MATCHES = 10
MAX_KEYWORDS_SHOWN = 8

def _priority(score: float) -> str:
    if score >= 0.70:
        return "High"
    if score >= 0.40:
        return "Medium"
    return "Low"


@api_view(["POST"])
def idea_match(request):
    """
    Upgraded Hybrid RAG Match Pipeline.
    POST body: { "projectName"?: str, "pitch": str, "context": str, "projectId"?: str, "excludeSelf"?: bool }
    """
    project_name = (request.data.get("projectName") or "").strip()
    pitch = (request.data.get("pitch") or "").strip()
    context = (request.data.get("context") or "").strip()

    query_text = " ".join(p for p in [project_name, pitch, context] if p)
    if not query_text:
        return Response(
            {"error": "Provide at least a 'pitch' or 'context' describing the idea."},
            status=400,
        )

    # Resolve origin draft ID for the query
    origin_draft_id = request.data.get("projectId") or request.data.get("draftId")
    exclude_self = request.data.get("excludeSelf", False)

    if not origin_draft_id and project_name:
        match_draft = get_burials_collection().find_one({"projectName": {"$regex": f"^{re.escape(project_name)}$", "$options": "i"}})
        if match_draft:
            origin_draft_id = str(match_draft["_id"])

    # 1. Retrieve candidates via vector search
    candidates = RetrievalService.retrieve_similar_drafts(
        query_text, 
        top_k=20, 
        origin_draft_id=origin_draft_id, 
        exclude_self=exclude_self
    )
    
    # Check if empty database
    if not candidates:
        # When no candidates are found, return an empty but valid response without placeholder UI values.
        return Response({
            "query": query_text,
            "matchCount": 0,
            "matches": [],
            "matchedDrafts": [],
            "similarityScore": "0.0",
            "aiInsights": {},
            "communityStatistics": {}
        })

    # 2. Extract metadata query fields (for re-ranking)
    tech_stack = request.data.get("techStack") or []
    if not tech_stack:
        common_techs = ["react", "vue", "angular", "node", "express", "django", "flask", "fastapi", "spring", "rails", "laravel", "python", "javascript", "typescript", "golang", "rust", "java", "c++", "c#", "mongodb", "postgresql", "mysql", "sqlite", "docker", "kubernetes", "aws", "gcp", "firebase", "supabase", "next.js", "tailwind"]
        tech_stack = [t for t in common_techs if t in query_text.lower()]
        
    tags = request.data.get("tags") or []
    category = request.data.get("category") or ""
    current_stage = request.data.get("currentStage") or ""
    
    query_metadata = {
        "techStack": tech_stack,
        "tags": tags,
        "category": category,
        "currentStage": current_stage
    }

    # 3. Hybrid Re-ranking
    ranked = ReRankingService.re_rank(
        query_metadata, 
        candidates, 
        top_n=MAX_MATCHES, 
        origin_draft_id=origin_draft_id, 
        exclude_self=exclude_self,
        query_text=query_text
    )

    # 4. Compute community stats
    community_stats = AnalyticsService.compute_community_stats(ranked)

    # 5. Format matches for response
    matches = []
    for item in ranked:
        d = item["draft"]
        score = item["hybridScore"]
        keywords = item["sharedKeywords"][:MAX_KEYWORDS_SHOWN]
        
        matches.append({
            "id": str(d.get("_id")),
            "projectName": d.get("projectName"),
            "oneLiner": d.get("oneLiner"),
            "domain": d.get("domain"),
            "techStack": d.get("techStack", []),
            "currentStage": d.get("currentStage"),
            "failureReason": d.get("failureReason"),
            "similarity": round(score, 4),
            "similarityPct": round(score * 100, 1),
            "priority": _priority(score),
            "matchedKeywords": keywords,
            "revivalStatus": d.get("revivalStatus"),
            "openForRevival": d.get("openForRevival"),
            "scoreBreakdown": item["scoreBreakdown"],
            "rawSimilarityBreakdown": item["rawSimilarityBreakdown"],
            "weightedHybridScore": item["weightedHybridScore"],
            "rankingReasons": item["rankingReasons"],
            "retrievalReasons": item["retrievalReasons"],
            "isCurrentProject": item["isCurrentProject"],
            "matchLabel": item["matchLabel"]
        })

    # 6. RAG Prompt Building & LLM Insights Generation
    rag_prompt = PromptBuilder.build_rag_prompt(pitch, context, ranked)
    ai_insights = LLMGenerationService.generate_insights(rag_prompt)

    # Calculate overall similarity score (highest similarity score)
    top_similarity = str(round(ranked[0]["hybridScore"] * 100, 1)) if ranked else "0.0"

    return Response({
        "query": query_text,
        "matchCount": len(matches),
        "matches": matches,
        "matchedDrafts": matches,
        "similarityScore": top_similarity,
        "aiInsights": ai_insights,
        "communityStatistics": community_stats
    })


@api_view(["POST", "GET"])
def sync_embeddings(request):
    try:
        from .rag_services import EmbeddingService
        count = EmbeddingService.sync_draft_embeddings()
        return Response({
            "status": "success",
            "updatedCount": count,
            "message": "All draft embeddings checked and synchronized."
        })
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["POST", "GET"])
def sync_draft_embedding(request, draft_id=None):
    """
    Generates or refreshes embedding for a single draft.
    Accepts draft_id in URL pattern or query params or request body {"draftId": "..."}.
    """
    did = draft_id
    if not did and hasattr(request, "data") and isinstance(request.data, dict):
        did = request.data.get("draftId") or request.data.get("draft_id")
    if not did and hasattr(request, "query_params"):
        did = request.query_params.get("draftId") or request.query_params.get("draft_id")

    if not did:
        return Response({"error": "Provide a draftId parameter"}, status=400)

    try:
        from .rag_services import EmbeddingService
        updated = EmbeddingService.sync_single_draft_embedding(str(did))
        return Response({
            "status": "success",
            "draftId": str(did),
            "updated": updated,
            "message": "Draft embedding refreshed successfully." if updated else "Draft embedding up to date or draft not found."
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"[SyncDraftEmbedding] Error syncing draft {did}: {e}")
        return Response({"status": "error", "message": str(e)}, status=500)
import os
import re
import json
import hashlib
import numpy as np
import requests

from .mongo_utils import get_burials_collection, get_workspaces_collection
from .embedding_store import get_model

# Constants for Gemini
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Small, deliberately short stopword list — just enough to stop "the", "a",
# "for" etc. from counting as a "shared word" match. Everything else is
# treated as a meaningful keyword.
STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "so", "of", "in",
    "on", "at", "to", "for", "with", "is", "are", "was", "were", "be",
    "been", "being", "this", "that", "it", "its", "as", "by", "from",
    "we", "our", "i", "you", "your", "app", "project", "idea", "using",
    "use", "based", "will", "can", "into", "about", "has", "have", "had"
}


def extract_keywords(text: str) -> set:
    """Lowercase, strip punctuation, drop stopwords/short tokens."""
    words = re.findall(r"[a-z0-9][a-z0-9\-\+]*", (text or "").lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def calculate_content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def get_searchable_text(draft_doc: dict, workspace_doc: dict = None) -> str:
    parts = [
        draft_doc.get("projectName", ""),
        draft_doc.get("oneLiner", ""),
        draft_doc.get("description", ""),
        " ".join(draft_doc.get("techStack") or []),
        " ".join(draft_doc.get("tags") or []),
        draft_doc.get("failureReason", "")
    ]
    if workspace_doc:
        parts.extend([
            workspace_doc.get("longDescription", ""),
            workspace_doc.get("featuresCompleted", ""),
            workspace_doc.get("currentBlockers", ""),
        ])
        tasks = workspace_doc.get("tasks") or []
        if isinstance(tasks, list):
            parts.extend([t.get("title", "") for t in tasks if isinstance(t, dict)])
        milestones = workspace_doc.get("milestones") or []
        if isinstance(milestones, list):
            parts.extend([m.get("label", "") for m in milestones if isinstance(m, dict)])
            
    return " ".join(p.strip() for p in parts if p).strip()


class EmbeddingService:
    @staticmethod
    def get_embedding(text: str) -> list:
        model = get_model()
        emb = model.encode(text, show_progress_bar=False)
        return emb.tolist()
        
    @staticmethod
    def sync_draft_embeddings():
        """
        Calculates and updates draft embeddings in bulk if out of date or missing.
        """
        db_drafts = list(get_burials_collection().find({}))
        workspaces = list(get_workspaces_collection().find({}))
        ws_map = {str(ws.get("draftId")): ws for ws in workspaces if ws.get("draftId")}
        
        for draft in db_drafts:
            did = str(draft["_id"])
            ws = ws_map.get(did)
            text = get_searchable_text(draft, ws)
            curr_hash = calculate_content_hash(text)
            
            stored_hash = draft.get("embedding_hash")
            stored_emb = draft.get("embedding")
            
            if not stored_emb or stored_hash != curr_hash:
                emb = EmbeddingService.get_embedding(text)
                get_burials_collection().update_one(
                    {"_id": draft["_id"]},
                    {"$set": {"embedding": emb, "embedding_hash": curr_hash}}
                )


class RetrievalService:
    @staticmethod
    def retrieve_similar_drafts(query_text: str, top_k: int = 20, origin_draft_id: str = None, exclude_self: bool = False) -> list:
        EmbeddingService.sync_draft_embeddings()
        
        query_emb = np.array(EmbeddingService.get_embedding(query_text))
        drafts = list(get_burials_collection().find({"status": {"$ne": "deleted"}}))
        
        candidates = []
        print(f"[RAG Retrieval] Starting retrieval for query: '{query_text[:60]}...' (exclude_self={exclude_self}, origin_draft_id={origin_draft_id})")
        
        for d in drafts:
            did = str(d["_id"])
            
            # Exclude check
            if exclude_self and origin_draft_id and did == str(origin_draft_id):
                print(f"[RAG Retrieval] Draft ID {did} ('{d.get('projectName')}') filtered out: reason=exclude_self is True")
                continue
                
            emb_list = d.get("embedding")
            if not emb_list:
                print(f"[RAG Retrieval] Draft ID {did} ('{d.get('projectName')}') filtered out: reason=no stored embedding found")
                continue
                
            emb = np.array(emb_list)
            dot = np.dot(query_emb, emb)
            norm_q = np.linalg.norm(query_emb)
            norm_d = np.linalg.norm(emb)
            similarity = float(dot / (norm_q * norm_d)) if norm_q > 0 and norm_d > 0 else 0.0
            similarity = max(0.0, min(1.0, similarity))
            
            # Log cosine similarity calculation
            if origin_draft_id and did == str(origin_draft_id):
                print(f"[RAG Retrieval] Cosine similarity computed for origin draft {did} ('{d.get('projectName')}'): {similarity:.4f}")
                
            candidates.append((d, similarity))
            
        candidates.sort(key=lambda x: x[1], reverse=True)
        retrieved_ids = [str(c[0]["_id"]) for c in candidates[:top_k]]
        print(f"[RAG Retrieval] Retrieved top draft IDs: {retrieved_ids}")
        return candidates[:top_k]


class ReRankingService:
    # A draft only counts as a real "match" if it shares at least one
    # meaningful keyword with the query, OR its embedding similarity is
    # high enough to be a genuine conceptual match even with different
    # wording. Pure embedding noise (no shared words, low similarity)
    # gets dropped instead of being padded into the results.
    SEMANTIC_ONLY_THRESHOLD = 0.55

    @staticmethod
    def get_match_label(score: float) -> str:
        pct = score * 100
        if pct >= 90: return "Excellent Match"
        if pct >= 80: return "Very Strong Match"
        if pct >= 70: return "Strong Match"
        if pct >= 55: return "Relevant Match"
        if pct >= 40: return "Possible Match"
        return "Weak Match"

    @staticmethod
    def re_rank(query_metadata: dict, candidates: list, top_n: int = 10, origin_draft_id: str = None, exclude_self: bool = False, query_text: str = "") -> list:
        """
        Ranks drafts using a weighted score:
        - Semantic Similarity: 60%
        - Tech Stack Match: 15%
        - Tag Match: 10%
        - Category Match: 5%
        - Project Stage Match: 5%
        - Draft Quality / Activity: 5%

        A draft is only kept if it actually shares words with the query
        (see SEMANTIC_ONLY_THRESHOLD for the no-shared-word fallback).
        """
        q_techs = [t.lower().strip() for t in (query_metadata.get("techStack") or [])]
        q_tags = [t.lower().strip() for t in (query_metadata.get("tags") or [])]
        q_category = (query_metadata.get("category") or "").lower().strip()
        q_stage = (query_metadata.get("currentStage") or "").lower().strip()
        q_keywords = extract_keywords(query_text)
        
        ranked_list = []
        for draft, semantic_score in candidates:
            did = str(draft["_id"])
            is_current = (origin_draft_id is not None) and (did == str(origin_draft_id))

            # 0. Keyword/word overlap against the draft's full text (name,
            # one-liner, description, tech stack, tags, failure reason)
            d_keywords = extract_keywords(get_searchable_text(draft))
            shared_keywords = q_keywords & d_keywords
            has_keyword_match = bool(shared_keywords)

            # 1. Tech match
            d_techs = [t.lower().strip() for t in (draft.get("techStack") or [])]
            tech_match = 0.0
            tech_intersection = []
            if q_techs:
                tech_intersection = list(set(q_techs) & set(d_techs))
                tech_match = len(tech_intersection) / len(set(q_techs))
            
            # 2. Tag match
            d_tags = [t.lower().strip() for t in (draft.get("tags") or [])]
            tag_match = 0.0
            tag_intersection = []
            if q_tags:
                tag_intersection = list(set(q_tags) & set(d_tags))
                tag_match = len(tag_intersection) / len(set(q_tags))
                
            # 3. Category match
            d_category = (draft.get("category") or "").lower().strip()
            category_match = 1.0 if q_category == d_category else 0.0
            
            # 4. Stage match
            d_stage = (draft.get("currentStage") or "").lower().strip()
            stage_match = 1.0 if q_stage == d_stage else 0.0
            
            # 5. Quality score
            upvotes = draft.get("upvotes", 0) or 0
            views = draft.get("views", 0) or 0
            bookmarks = draft.get("bookmarks", 0) or 0
            quality_score = min(1.0, (upvotes * 0.1 + bookmarks * 0.2 + views * 0.02))
            
            # Final Score Calculation
            final_score = (
                semantic_score * 0.60 +
                tech_match * 0.15 +
                tag_match * 0.10 +
                category_match * 0.05 +
                stage_match * 0.05 +
                quality_score * 0.05
            )

            # Generate ranking and retrieval reasons (no engineering terminology)
            ranking_reasons = []
            if is_current:
                ranking_reasons.append("Current reviewed project")
            if semantic_score > 0.85:
                ranking_reasons.append("Highly similar product vision")
            if tech_match > 0.6:
                ranking_reasons.append("Shared architecture components")
            if stage_match > 0:
                ranking_reasons.append("Same development maturity level")
            if quality_score > 0.4:
                ranking_reasons.append("High community activity")
            if not ranking_reasons:
                ranking_reasons.append("Comparable roadmap milestones")

            retrieval_reasons = []
            if is_current:
                retrieval_reasons.append("This is the current reviewed project")
            if d_category:
                retrieval_reasons.append(f"Same problem domain: target {draft.get('category')}")
            if tech_intersection:
                retrieval_reasons.append(f"Shared technologies: utilizes {', '.join(tech_intersection[:2])}")
            if d_stage:
                retrieval_reasons.append(f"Similar project maturity: {draft.get('currentStage')}")
            if tag_intersection:
                retrieval_reasons.append(f"Comparable vision: {', '.join(tag_intersection[:2])}")
            if draft.get("failureReason"):
                retrieval_reasons.append(f"Common blocker: Stall due to {draft.get('failureReason')[:40]}")
            
            ranked_list.append({
                "draft": draft,
                "hybridScore": round(final_score, 4),
                "weightedHybridScore": round(final_score, 4),
                "isCurrentProject": is_current,
                "matchLabel": ReRankingService.get_match_label(final_score),
                "hasKeywordMatch": has_keyword_match,
                "sharedKeywords": sorted(shared_keywords),
                "scoreBreakdown": {
                    "semantic": round(semantic_score * 0.60, 4),
                    "tech": round(tech_match * 0.15, 4),
                    "tags": round(tag_match * 0.10, 4),
                    "category": round(category_match * 0.05, 4),
                    "stage": round(stage_match * 0.05, 4),
                    "quality": round(quality_score * 0.05, 4)
                },
                "rawSimilarityBreakdown": {
                    "semantic": round(semantic_score, 4),
                    "tech": round(tech_match, 4),
                    "tags": round(tag_match, 4),
                    "category": round(category_match, 4),
                    "stage": round(stage_match, 4),
                    "quality": round(quality_score, 4)
                },
                "rankingReasons": ranking_reasons[:3],
                "retrievalReasons": retrieval_reasons[:5]
            })
            
        ranked_list.sort(key=lambda x: x["hybridScore"], reverse=True)

        # Keep a draft only if it shares an actual word with the query,
        # or (no shared words, but) the embeddings agree strongly enough
        # that it's a real conceptual match despite different phrasing.
        filtered_list = [
            item for item in ranked_list
            if item["hasKeywordMatch"]
            or item["rawSimilarityBreakdown"]["semantic"] >= ReRankingService.SEMANTIC_ONLY_THRESHOLD
        ]

        return filtered_list[:top_n]


class AnalyticsService:
    @staticmethod
    def compute_community_stats(ranked_items: list) -> dict:
        total_drafts = get_burials_collection().count_documents({"status": {"$ne": "deleted"}})
        
        if not ranked_items:
            return {
                "totalDrafts": total_drafts,
                "retrievedMatches": 0,
                "highestSimilarity": 0.0,
                "averageSimilarity": 0.0,
                "confidenceScore": "Low",
                "commonFailure": "None",
                "commonTech": "None",
                "avgProjectStage": "None",
                "mostSuccessfulCategory": "None",
                "avgCompletionRate": 0,
                "stageDistribution": {},
                "techFrequency": [],
                "failureFrequency": [],
                "completionStatistics": {"averageProgress": 0, "progressRange": "0%", "totalCount": 0},
                "confidenceLevel": "Low",
                "confidenceExplanation": "Insufficient matching projects found in DraftYard database."
            }
            
        scores = [item["hybridScore"] for item in ranked_items]
        highest = max(scores)
        average = sum(scores) / len(scores)
        variance = float(np.var(scores)) if len(scores) > 1 else 0.0
        strong_matches = sum(1 for s in scores if s >= 0.70)
        
        # Confidence Level & Explanation
        if highest >= 0.85 and average >= 0.75 and strong_matches >= 5:
            confidence_level = "High"
            confidence_explanation = f"Retrieved projects display a high density of strong matches (average score {average*100:.1f}%) in highly overlapping domains."
        elif highest >= 0.70 and average >= 0.60:
            confidence_level = "Medium"
            confidence_explanation = f"Matches identified are moderately aligned (highest similarity {highest*100:.1f}%) with normal domain variation."
        else:
            confidence_level = "Low"
            confidence_explanation = f"Retrieved projects span multiple unrelated domains, with only {strong_matches} projects exceeding 70% hybrid similarity."
            
        # Common failure reason (mode)
        failures = [item["draft"].get("failureReason") for item in ranked_items if item["draft"].get("failureReason")]
        common_failure = max(set(failures), key=failures.count) if failures else "Technical Complexity"
        
        # Common tech stack
        techs = []
        for item in ranked_items:
            techs.extend(item["draft"].get("techStack") or [])
        common_tech = max(set(techs), key=techs.count) if techs else "React + Node + MongoDB"
        
        # Average project stage
        stages = [item["draft"].get("currentStage") for item in ranked_items if item["draft"].get("currentStage")]
        avg_stage = max(set(stages), key=stages.count) if stages else "Prototype"
        
        # Stage distribution
        stage_dist = {}
        for item in ranked_items:
            s = item["draft"].get("currentStage") or "Idea"
            stage_dist[s] = stage_dist.get(s, 0) + 1
            
        # Tech frequency
        tech_counts = {}
        for item in ranked_items:
            for t in (item["draft"].get("techStack") or []):
                t_clean = t.strip()
                if t_clean:
                    tech_counts[t_clean] = tech_counts.get(t_clean, 0) + 1
        tech_freq = [{"name": k, "count": v} for k, v in sorted(tech_counts.items(), key=lambda x: x[1], reverse=True)]

        # Failure frequency
        fail_counts = {}
        for item in ranked_items:
            reason = item["draft"].get("failureReason")
            if reason:
                fail_counts[reason] = fail_counts.get(reason, 0) + 1
        fail_freq = [{"name": k, "count": v} for k, v in sorted(fail_counts.items(), key=lambda x: x[1], reverse=True)]

        # Progress stats
        completion_rates = []
        progress_dist = {"0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0, "Completed": 0}
        for item in ranked_items:
            stage = (item["draft"].get("currentStage") or "").lower()
            progress = 30
            if "idea" in stage:
                progress = 15
                progress_dist["0-25%"] += 1
            elif "proto" in stage:
                progress = 45
                progress_dist["25-50%"] += 1
            elif "mvp" in stage:
                progress = 80
                progress_dist["75-100%"] += 1
            elif "launch" in stage or "live" in stage or "revive" in stage:
                progress = 100
                progress_dist["Completed"] += 1
            else:
                progress_dist["25-50%"] += 1
            completion_rates.append(progress)
            
        avg_completion = int(sum(completion_rates) / len(completion_rates)) if completion_rates else 0
        min_progress = min(completion_rates) if completion_rates else 0
        max_progress = max(completion_rates) if completion_rates else 0
        progress_range = f"{min_progress}%-{max_progress}%" if completion_rates else "0%"
        
        # Most successful category (highest stage progress average)
        cat_progress = {}
        for item in ranked_items:
            cat = item["draft"].get("category") or item["draft"].get("domain") or "Other"
            stage = (item["draft"].get("currentStage") or "").lower()
            progress = 30
            if "idea" in stage:
                progress = 15
            elif "proto" in stage:
                progress = 45
            elif "mvp" in stage:
                progress = 80
            elif "launch" in stage or "live" in stage or "revive" in stage:
                progress = 100
                
            if cat not in cat_progress:
                cat_progress[cat] = []
            cat_progress[cat].append(progress)
            
        best_cat = "Developer Tools"
        best_avg = 0.0
        for cat, rates in cat_progress.items():
            avg = sum(rates) / len(rates)
            if avg > best_avg:
                best_avg = avg
                best_cat = cat
                
        return {
            "totalDrafts": total_drafts,
            "retrievedMatches": len(ranked_items),
            "highestSimilarity": round(highest * 100, 1),
            "averageSimilarity": round(average * 100, 1),
            "confidenceScore": confidence_level,
            "confidenceLevel": confidence_level,
            "confidenceExplanation": confidence_explanation,
            "commonFailure": common_failure,
            "commonTech": common_tech,
            "avgProjectStage": avg_stage,
            "mostSuccessfulCategory": best_cat,
            "avgCompletionRate": avg_completion,
            "stageDistribution": stage_dist,
            "techFrequency": tech_freq,
            "failureFrequency": fail_freq,
            "completionDistribution": progress_dist,
            "completionStatistics": {
                "averageProgress": avg_completion,
                "progressRange": progress_range,
                "totalCount": len(ranked_items)
            }
        }


class PromptBuilder:
    @staticmethod
    def build_rag_prompt(pitch: str, context: str, matched_drafts: list) -> str:
        drafts_context = []
        for idx, item in enumerate(matched_drafts):
            d = item["draft"]
            score = item["hybridScore"]
            draft_info = (
                f"Draft {idx + 1}:\n"
                f"- Name: {d.get('projectName')}\n"
                f"- Pitch/One-liner: {d.get('oneLiner')}\n"
                f"- Description: {d.get('description')}\n"
                f"- Tech Stack: {', '.join(d.get('techStack', []))}\n"
                f"- Tags: {', '.join(d.get('tags', []))}\n"
                f"- Category: {d.get('category')}\n"
                f"- Current Stage: {d.get('currentStage')}\n"
                f"- Failure Reason: {d.get('failureReason', 'None specified')}\n"
                f"- Match Score: {score:.2f}\n"
            )
            drafts_context.append(draft_info)
            
        context_str = "\n".join(drafts_context)
        
        # In Part 1 and 9, LLM structured scoring is required
        prompt = f"""You are a startup project consultant.
Analyze the user's project idea based ONLY on the retrieved semantically similar drafts from the platform database. Do not hallucinate.

User's Idea Pitch: {pitch}
User's Idea Context: {context}

Retrieved Drafts Data:
{context_str}

Respond with ONLY a single valid JSON object matching exactly this structure:
{{
  "summary": "1-2 sentence overall similarity summary of user idea against retrieved drafts",
  "whySimilar": "Explanation of why these drafts are semantically or conceptually similar",
  "commonFailures": ["List of common failure patterns / reasons observed in these drafts"],
  "successPatterns": ["List of success patterns or positive metrics observed in these drafts"],
  "recommendedStack": ["Recommended tech stack or libraries based on these drafts' stack"],
  "roadmap": ["Actionable milestones based on the retrieved projects' path"],
  "risks": ["Potential risks / blockers identified from these drafts' failureReasons"],
  "revivalSuggestions": ["Actionable ideas for collaboration or revival based on these drafts' state"],
  "overallAnalysis": "Grounded AI synthesis referencing retrieved evidence and statistics (e.g. '3 of 5 projects stalled because of authentication complexity')",
  "overallScore": <integer score between 0 and 100 based on feasibility and validation>,
  "scoreDimensions": [
    {{"dimension": "Innovation", "score": <int 0-100>, "reason": "Reason based on similarity to current drafts"}},
    {{"dimension": "Execution Feasibility", "score": <int 0-100>, "reason": "Reason referencing common roadblocks"}},
    {{"dimension": "Market Competition", "score": <int 0-100>, "reason": "Reason referencing number of overlapping projects"}},
    {{"dimension": "Community Validation", "score": <int 0-100>, "reason": "Reason referencing draft validation activity"}},
    {{"dimension": "Technical Complexity", "score": <int 0-100>, "reason": "Reason referencing blockers or failures"}},
    {{"dimension": "Revival Potential", "score": <int 0-100>, "reason": "Reason referencing active revival drafts"}}
  ]
}}
"""
        return prompt


class LLMGenerationService:
    @staticmethod
    def generate_insights(prompt: str) -> dict:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return {
                "summary": "AI Analysis is unavailable because GEMINI_API_KEY is not set.",
                "commonFailures": [],
                "successPatterns": [],
                "recommendedStack": [],
                "roadmap": [],
                "risks": [],
                "revivalSuggestions": [],
                "overallAnalysis": "AI Analysis is unavailable.",
                "overallScore": 50,
                "scoreDimensions": []
            }
            
        from .idea_analysis_views import _call_gemini_with_fallback
        
        resp, error_text = _call_gemini_with_fallback(prompt, api_key)
        
        if resp:
            try:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                cleaned = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
                return json.loads(cleaned)
            except Exception as e:
                print(f"[RAG Generation] Parsing error: {e}")
        else:
            print(f"[RAG Generation] Gemini failed: {error_text}")
            
        return {
            "summary": "Failed to generate RAG insights from database context.",
            "commonFailures": [],
            "successPatterns": [],
            "recommendedStack": [],
            "roadmap": [],
            "risks": [],
            "revivalSuggestions": [],
            "overallAnalysis": "Failed to synthesize analysis due to generation error.",
            "overallScore": 50,
            "scoreDimensions": []
        }
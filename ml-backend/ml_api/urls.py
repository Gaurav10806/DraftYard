from django.urls import path
from . import (
    views,
    analytics_views,
    stack_views,
    survival_views,
    idea_analysis_views,
    idea_match_views,
    chat_views,
)

urlpatterns = [
    path("classify/", views.classify, name="classify"),

    path("analytics/failure-patterns/", analytics_views.failure_patterns, name="analytics-failure-patterns"),
    path("analytics/shelve-rate-by-stack/", analytics_views.shelve_rate_by_stack, name="analytics-shelve-rate-by-stack"),
    path("analytics/shelve-stage/", analytics_views.shelve_stage, name="analytics-shelve-stage"),
    path("analytics/solo-vs-team/", analytics_views.solo_vs_team, name="analytics-solo-vs-team"),
    path("analytics/time-invested/", analytics_views.time_invested, name="analytics-time-invested"),

    path("stack/<str:stack_name>/", stack_views.stack_insights, name="stack-insights"),

    path("survival-check/", survival_views.survival_check, name="survival-check"),
    path("idea-analysis/", idea_analysis_views.idea_analysis),
    path("idea-match/", idea_match_views.idea_match),
    path("chat/", chat_views.chat),
]
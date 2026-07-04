from django.urls import path
from . import views, analytics_views

urlpatterns = [
    path("classify/", views.classify, name="classify"),

    # TASK 2 — Analytics APIs (Mem A's insights dashboard)
    path("analytics/failure-patterns/", analytics_views.failure_patterns, name="analytics-failure-patterns"),
    path("analytics/shelve-rate-by-stack/", analytics_views.shelve_rate_by_stack, name="analytics-shelve-rate-by-stack"),
    path("analytics/shelve-stage/", analytics_views.shelve_stage, name="analytics-shelve-stage"),
    path("analytics/solo-vs-team/", analytics_views.solo_vs_team, name="analytics-solo-vs-team"),
    path("analytics/time-invested/", analytics_views.time_invested, name="analytics-time-invested"),
]

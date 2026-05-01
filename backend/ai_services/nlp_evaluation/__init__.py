"""
NLP Evaluation Module
"""

try:
    from .gemini_evaluator import AdvancedReportEvaluator
    HAS_FULL_NLP = True
except Exception:
    HAS_FULL_NLP = False

from .report_evaluator_light import LightReportEvaluator

__all__ = ['AdvancedReportEvaluator', 'LightReportEvaluator', 'HAS_FULL_NLP']

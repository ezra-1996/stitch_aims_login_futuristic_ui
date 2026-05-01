"""
Lightweight Report Evaluator - Zero Dependencies
Basic text analysis without external NLP libraries
"""

import re
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class LightReportEvaluator:
    """
    Lightweight report evaluation using basic text analysis
    """
    
    def __init__(self):
        self.quality_keywords = {
            'technical': ['developed', 'implemented', 'coded', 'built', 'created', 'programmed'],
            'learning': ['learned', 'understood', 'studied', 'researched', 'discovered'],
            'professional': ['collaborated', 'communicated', 'presented', 'organized', 'managed'],
            'problem_solving': ['solved', 'resolved', 'fixed', 'improved', 'optimized']
        }
        logger.info("Lightweight report evaluator initialized")
    
    def evaluate_report(self, report_text: str, task_description: str = "") -> Dict[str, Any]:
        """
        Basic report evaluation
        """
        words = report_text.lower().split()
        word_count = len(words)
        
        if word_count == 0:
            return self._empty_report_result()
        
        # Length score
        length_score = min(1.0, word_count / 300)
        
        # Keyword relevance
        keyword_scores = {}
        for category, keywords in self.quality_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in report_text.lower())
            keyword_scores[category] = min(1.0, matches / len(keywords))
        
        # Content quality (average of keyword scores)
        content_score = sum(keyword_scores.values()) / len(keyword_scores)
        
        # Sentence structure
        sentences = [s.strip() for s in re.split(r'[.!?]+', report_text) if s.strip()]
        sentence_count = len(sentences)
        avg_sentence_len = word_count / sentence_count if sentence_count > 0 else 0
        
        # Structure score
        if 15 <= avg_sentence_len <= 25:
            structure_score = 0.9
        elif 10 <= avg_sentence_len <= 30:
            structure_score = 0.7
        else:
            structure_score = 0.5
        
        # Overall score
        overall_score = (
            length_score * 0.3 +
            content_score * 0.4 +
            structure_score * 0.3
        )
        
        feedback = self._generate_feedback(length_score, content_score, word_count)
        
        # Compute confidence based on data quality
        # More words = higher confidence; very short reports = low confidence
        length_confidence = min(1.0, word_count / 200)  # Full confidence at 200+ words
        # Score variance: if all sub-scores agree, confidence is higher
        sub_scores = [content_score, length_score, structure_score]
        score_range = max(sub_scores) - min(sub_scores)
        consistency_confidence = 1.0 - (score_range * 0.5)  # Penalize high variance
        dynamic_confidence = round(min(0.95, (length_confidence * 0.5 + consistency_confidence * 0.5)), 3)

        return {
            'ai_score': round(overall_score, 3),
            'score_breakdown': {
                'content_quality': round(content_score, 3),
                'report_length': round(length_score, 3),
                'writing_structure': round(structure_score, 3)
            },
            'detailed_analysis': {
                'word_count': word_count,
                'sentence_count': sentence_count,
                'keyword_scores': keyword_scores
            },
            'ai_feedback': feedback,
            'confidence_level': dynamic_confidence,
            'evaluation_method': 'lightweight'
        }
    
    def _empty_report_result(self) -> Dict[str, Any]:
        """Result for empty report"""
        return {
            'ai_score': 0.0,
            'ai_feedback': 'Report is empty',
            'confidence_level': 0.0
        }
    
    def _generate_feedback(self, length_score: float, content_score: float, word_count: int) -> str:
        """Generate feedback"""
        feedback = []
        
        if length_score >= 0.8:
            feedback.append("Excellent report length with sufficient detail.")
        elif length_score >= 0.5:
            feedback.append("Good length; consider adding more specific examples.")
        else:
            feedback.append("Report is too brief; provide more detail.")
        
        if content_score >= 0.7:
            feedback.append("Content shows good understanding of internship activities.")
        elif content_score >= 0.5:
            feedback.append("Content is adequate; focus more on specific achievements.")
        else:
            feedback.append("Content needs more relevance to internship tasks.")
        
        return " ".join(feedback)

# Factory function
def create_report_evaluator():
    """Create report evaluator with fallback"""
    try:
        from ai_services.nlp_evaluation.report_evaluator import AdvancedReportEvaluator
        return AdvancedReportEvaluator()
    except ImportError:
        logger.warning("Using lightweight report evaluator (full version not available)")
        return LightReportEvaluator()

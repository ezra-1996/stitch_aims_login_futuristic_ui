import logging
import json
import os
from typing import Dict, Any
from datetime import datetime

try:
    import google.genai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from decouple import config

logger = logging.getLogger(__name__)

GEMINI_API_KEY = config('GEMINI_API_KEY', default=None)
if GEMINI_API_KEY:
    if not HAS_GENAI:
        logger.warning("GEMINI_API_KEY set but google.genai SDK import failed.")
else:
    logger.warning("GEMINI_API_KEY not found in environment!")

class AdvancedReportEvaluator:
    """
    Advanced report evaluation using Gemini generative AI.
    Replaces the local Sentence-Transformer and LanguageTool models.
    """
    
    def __init__(self, **kwargs):
        """
        Initialize the Gemini evaluator.
        """
        self.api_available = bool(GEMINI_API_KEY and HAS_GENAI)
        if self.api_available:
            self.client = genai.Client(api_key=GEMINI_API_KEY)
            self.model_name = 'gemini-2.0-flash'
            logger.info("Gemini Evaluator initialized (online mode)")
        else:
            self.client = None
            logger.info("Gemini Evaluator initialized (offline fallback mode)")
            
    def evaluate_report(self, report_text: str, task_description: str = "") -> Dict[str, Any]:
        """
        Comprehensive report evaluation via Gemini
        """
        if not GEMINI_API_KEY:
            logger.error("Cannot evaluate report because GEMINI_API_KEY is not set.")
            return {
                'ai_score': 0.5,
                'ai_feedback': 'API Key not configured. Evaluation unavailable.',
                'confidence_level': 0.0,
                'score_breakdown': {
                    'semantic_relevance': 0.5,
                    'content_quality': 0.5,
                    'grammar_clarity': 0.5,
                    'writing_structure': 0.5
                }
            }

        prompt = f"""
You are an expert internship evaluator. Assess the student's weekly report based on the provided task description.
Evaluate the report on four specific criteria, scoring them from 0.0 to 1.0 (where 1.0 is perfect):
1. 'semantic_relevance': How well does the report address the stated task description? (If no task is given, assess the report's relevance to a professional setting).
2. 'content_quality': Are the actions taken detailed, professional, and do they show learning?
3. 'grammar_clarity': Is the text clear, well-written, and free of grammatical/spelling errors?
4. 'writing_structure': Are the ideas organized logically?

You MUST return a pure JSON object containing the exact following keys. Do NOT include any markdown formatting (like ```json), just the plain JSON string:
{{
    "ai_score": (overall score from 0.0 to 1.0),
    "semantic_relevance": (0.0 to 1.0),
    "content_quality": (0.0 to 1.0),
    "grammar_clarity": (0.0 to 1.0),
    "writing_structure": (0.0 to 1.0),
    "ai_feedback": "A very detailed, professional 2-3 sentence paragraph explaining the evaluation, highlighting strengths and specific areas to improve."
}}

Task Description: "{task_description}"

Weekly Report: "{report_text}"
"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            result_text = response.text.strip()
            
            # Remove any possible markdown blocks if the model ignored directions
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
                
            result_json = json.loads(result_text.strip())
            
            # Format according to what tasks.py expects
            final_score = result_json.get('ai_score', 0.5)
            semantic_score = result_json.get('semantic_relevance', 0.5)
            content_quality = result_json.get('content_quality', 0.5)
            grammar_clarity = result_json.get('grammar_clarity', 0.5)
            writing_structure = result_json.get('writing_structure', 0.5)
            feedback = result_json.get('ai_feedback', "Good effort.")
            
            return {
                'ai_score': final_score,
                'score_breakdown': {
                    'semantic_relevance': semantic_score,
                    'content_quality': content_quality,
                    'grammar_clarity': grammar_clarity,
                    'writing_structure': writing_structure
                },
                'ai_feedback': feedback,
                'confidence_level': 0.95,
                'evaluation_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Gemini evaluation failed: {e}")
            # Fall back to offline evaluation
            return self._offline_evaluate(report_text, task_description, str(e))

    def _offline_evaluate(self, report_text: str, task_description: str = "", error_reason: str = "") -> Dict[str, Any]:
        """
        Offline fallback evaluator using basic NLP heuristics.
        Used when Gemini API is unavailable (quota exceeded, network issues, etc.).
        """
        words = report_text.split()
        word_count = len(words)
        sentences = [s.strip() for s in report_text.replace('!', '.').replace('?', '.').split('.') if s.strip()]
        sentence_count = len(sentences)
        
        # Word count scoring (more detail = better)
        if word_count >= 300:
            content_score = 0.9
        elif word_count >= 200:
            content_score = 0.8
        elif word_count >= 100:
            content_score = 0.7
        elif word_count >= 50:
            content_score = 0.5
        else:
            content_score = 0.3
        
        # Structure scoring (good sentence count = organized)
        if sentence_count >= 10:
            structure_score = 0.85
        elif sentence_count >= 5:
            structure_score = 0.7
        else:
            structure_score = 0.5
        
        # Relevance scoring (check for professional keywords)
        professional_keywords = ['completed', 'learned', 'implemented', 'developed', 'task', 'project',
                                 'team', 'meeting', 'challenge', 'solution', 'progress', 'goal',
                                 'deadline', 'communication', 'research', 'analysis', 'report']
        text_lower = report_text.lower()
        keyword_hits = sum(1 for kw in professional_keywords if kw in text_lower)
        relevance_score = min(0.9, 0.4 + (keyword_hits * 0.05))
        
        # Grammar approximation (avg words per sentence)
        if sentence_count > 0:
            avg_words = word_count / sentence_count
            if 10 <= avg_words <= 25:
                grammar_score = 0.8
            elif 5 <= avg_words < 10 or 25 < avg_words <= 35:
                grammar_score = 0.6
            else:
                grammar_score = 0.4
        else:
            grammar_score = 0.3
        
        overall = round((content_score + structure_score + relevance_score + grammar_score) / 4, 2)
        
        feedback_parts = []
        if content_score >= 0.7:
            feedback_parts.append(f"The report provides good detail with {word_count} words.")
        else:
            feedback_parts.append(f"The report could use more detail (only {word_count} words).")
        
        if keyword_hits >= 3:
            feedback_parts.append("It demonstrates professional terminology and awareness.")
        else:
            feedback_parts.append("Consider using more professional and task-specific language.")
        
        if structure_score >= 0.7:
            feedback_parts.append("The writing is well-structured with clear sentences.")
        else:
            feedback_parts.append("Try to organize ideas into more complete sentences.")
        
        feedback = " ".join(feedback_parts)
        if error_reason and '429' in error_reason:
            feedback += " (Evaluated offline due to API quota limits.)"
        
        return {
            'ai_score': overall,
            'score_breakdown': {
                'semantic_relevance': relevance_score,
                'content_quality': content_score,
                'grammar_clarity': grammar_score,
                'writing_structure': structure_score
            },
            'ai_feedback': feedback,
            'confidence_level': 0.6,
            'evaluation_method': 'offline_heuristic',
            'evaluation_timestamp': datetime.now().isoformat()
        }

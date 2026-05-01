"""
Advanced NLP Evaluation Module for Weekly Internship Reports
Uses Sentence-BERT and LanguageTool for comprehensive analysis
"""

import logging
import re
from typing import Dict, List, Any, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

# Import with error handling
try:
    from sentence_transformers import SentenceTransformer, util
    import language_tool_python
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
    LANGUAGETOOL_AVAILABLE = True
    logger.info("NLP libraries imported successfully")
except ImportError as e:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    LANGUAGETOOL_AVAILABLE = False
    logger.warning(f"NLP libraries not available: {e}")

class AdvancedReportEvaluator:
    """
    Advanced report evaluation using modern NLP techniques
    """
    
    def __init__(self, 
                 sbert_model: str = "all-MiniLM-L6-v2",
                 grammar_language: str = "en-US"):
        """
        Initialize advanced report evaluator
        """
        self.sbert_model_name = sbert_model
        self.grammar_language = grammar_language
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.sbert_model = SentenceTransformer(sbert_model)
                logger.info(f"Sentence-BERT model loaded: {sbert_model}")
            except Exception as e:
                logger.error(f"Failed to load Sentence-BERT model: {e}")
                self.sbert_model = None
        else:
            self.sbert_model = None
        
        if LANGUAGETOOL_AVAILABLE:
            try:
                self.grammar_tool = language_tool_python.LanguageTool(grammar_language)
                logger.info(f"LanguageTool initialized for {grammar_language}")
            except Exception as e:
                logger.error(f"Failed to initialize LanguageTool: {e}")
                self.grammar_tool = None
        else:
            self.grammar_tool = None
        
        # Quality reference texts
        self.quality_criteria = {
            'technical_skills': [
                "application of technical knowledge to practical problems",
                "demonstration of proficiency with tools and technologies",
                "ability to learn and adapt to new technical challenges",
                "production of quality technical deliverables"
            ],
            'professional_development': [
                "professional conduct and workplace etiquette",
                "time management and meeting deadlines",
                "accepting and implementing feedback",
                "effective teamwork and collaboration"
            ],
            'learning_outcomes': [
                "clear demonstration of learning and skill development",
                "connection between academic knowledge and practical application",
                "reflection on challenges and solutions",
                "articulation of professional growth"
            ]
        }
        
        logger.info("Advanced report evaluator initialized")
    
    def evaluate_semantic_similarity(self, report_text: str, task_description: str) -> float:
        """
        Evaluate semantic relevance using Sentence-BERT
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE or self.sbert_model is None:
            # Fallback to basic text analysis
            return self._fallback_semantic_similarity(report_text, task_description)
        
        try:
            # Encode texts
            report_embedding = self.sbert_model.encode(report_text, convert_to_tensor=True)
            task_embedding = self.sbert_model.encode(task_description, convert_to_tensor=True)
            
            # Calculate cosine similarity
            similarity = util.pytorch_cos_sim(report_embedding, task_embedding).item()
            similarity = max(0.0, min(1.0, similarity))  # Clamp to 0-1
            
            logger.debug(f"Semantic similarity: {similarity:.3f}")
            return similarity
            
        except Exception as e:
            logger.error(f"Semantic similarity evaluation failed: {e}")
            return self._fallback_semantic_similarity(report_text, task_description)
    
    def _fallback_semantic_similarity(self, report_text: str, task_description: str) -> float:
        """Fallback semantic similarity using basic text analysis"""
        report_words = set(report_text.lower().split())
        task_words = set(task_description.lower().split())
        
        if not task_words:
            return 0.5
        
        common_words = report_words.intersection(task_words)
        similarity = len(common_words) / len(task_words)
        
        # Adjust for report length
        word_count = len(report_words)
        length_factor = min(1.0, word_count / 100)
        
        return similarity * length_factor
    
    def evaluate_grammar_and_clarity(self, text: str) -> Dict[str, Any]:
        """
        Comprehensive grammar and writing quality evaluation
        """
        if not LANGUAGETOOL_AVAILABLE or self.grammar_tool is None:
            return self._fallback_grammar_evaluation(text)
        
        try:
            # Grammar and spelling check
            matches = self.grammar_tool.check(text)
            
            # Text statistics
            words = text.split()
            word_count = len(words)
            sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
            sentence_count = len(sentences)
            
            # Calculate error rate
            error_rate = (len(matches) / word_count * 100) if word_count > 0 else float('inf')
            
            # Quality scores
            grammar_score = self._calculate_grammar_score(error_rate)
            vocabulary_score = self._calculate_vocabulary_score(words)
            structure_score = self._calculate_structure_score(sentences)
            
            return {
                'grammar_score': grammar_score,
                'vocabulary_score': vocabulary_score,
                'structure_score': structure_score,
                'error_rate': error_rate,
                'total_errors': len(matches),
                'word_count': word_count,
                'sentence_count': sentence_count,
                'avg_sentence_length': word_count / sentence_count if sentence_count > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Grammar evaluation failed: {e}")
            return self._fallback_grammar_evaluation(text)
    
    def _fallback_grammar_evaluation(self, text: str) -> Dict[str, Any]:
        """Fallback grammar evaluation"""
        words = text.split()
        word_count = len(words)
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        # Simulate error rate based on text complexity
        complexity = len(set(words)) / max(1, word_count)
        error_rate = max(1.0, 10.0 - (complexity * 15))
        
        return {
            'grammar_score': max(0.5, 1.0 - (error_rate / 20)),
            'vocabulary_score': complexity,
            'structure_score': 0.7,
            'error_rate': error_rate,
            'total_errors': int(error_rate * word_count / 100),
            'word_count': word_count,
            'sentence_count': len(sentences),
            'avg_sentence_length': word_count / len(sentences) if sentences else 0
        }
    
    def _calculate_grammar_score(self, error_rate: float) -> float:
        """Calculate grammar score from error rate"""
        if error_rate <= 1.0: return 0.95
        elif error_rate <= 3.0: return 0.85
        elif error_rate <= 5.0: return 0.75
        elif error_rate <= 8.0: return 0.65
        elif error_rate <= 12.0: return 0.55
        else: return 0.4
    
    def _calculate_vocabulary_score(self, words: List[str]) -> float:
        """Calculate vocabulary richness score"""
        if not words: return 0.5
        unique_words = len(set(words))
        return min(1.0, unique_words / len(words) * 3)
    
    def _calculate_structure_score(self, sentences: List[str]) -> float:
        """Calculate sentence structure score"""
        if len(sentences) < 2: return 0.5
        
        # Calculate sentence length variation
        lengths = [len(s.split()) for s in sentences]
        avg_length = sum(lengths) / len(lengths)
        variation = np.std(lengths) / avg_length if avg_length > 0 else 0
        
        # Ideal variation: 0.3-0.6
        if 0.3 <= variation <= 0.6: return 0.9
        elif 0.2 <= variation <= 0.8: return 0.7
        else: return 0.5
    
    def evaluate_content_quality(self, report_text: str) -> Dict[str, float]:
        """
        Evaluate content quality against reference standards
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE or self.sbert_model is None:
            return self._fallback_content_quality(report_text)
        
        try:
            report_embedding = self.sbert_model.encode(report_text, convert_to_tensor=True)
            category_scores = {}
            
            for category, references in self.quality_criteria.items():
                reference_embeddings = self.sbert_model.encode(references, convert_to_tensor=True)
                similarities = util.pytorch_cos_sim(report_embedding, reference_embeddings)
                category_score = similarities.max().item()
                category_scores[category] = max(0.0, category_score)
            
            return category_scores
            
        except Exception as e:
            logger.error(f"Content quality evaluation failed: {e}")
            return self._fallback_content_quality(report_text)
    
    def _fallback_content_quality(self, report_text: str) -> Dict[str, float]:
        """Fallback content quality evaluation"""
        text_lower = report_text.lower()
        scores = {}
        
        for category, references in self.quality_criteria.items():
            # Count keyword matches
            matches = sum(1 for ref in references 
                         if any(word in text_lower for word in ref.split()))
            scores[category] = min(1.0, matches / len(references))
        
        return scores
    
    def generate_detailed_feedback(self, evaluation_results: Dict[str, Any]) -> str:
        """Generate comprehensive feedback"""
        feedback_parts = []
        
        # Content feedback
        content_score = evaluation_results.get('content_quality', 0.5)
        if content_score >= 0.8:
            feedback_parts.append("Excellent content with strong relevance to internship objectives.")
        elif content_score >= 0.6:
            feedback_parts.append("Good content coverage; consider adding more specific examples.")
        else:
            feedback_parts.append("Content needs improvement in relevance and detail.")
        
        # Grammar feedback
        error_rate = evaluation_results.get('error_rate', 10.0)
        if error_rate <= 2.0:
            feedback_parts.append("Excellent writing quality with minimal errors.")
        elif error_rate <= 5.0:
            feedback_parts.append("Good writing clarity with some minor errors.")
        else:
            feedback_parts.append("Writing needs attention to grammar and clarity.")
        
        # Structure feedback
        structure_score = evaluation_results.get('structure_score', 0.5)
        if structure_score >= 0.8:
            feedback_parts.append("Well-structured report with good flow.")
        elif structure_score >= 0.6:
            feedback_parts.append("Clear structure; consider varying sentence lengths.")
        else:
            feedback_parts.append("Improve report structure and organization.")
        
        return " ".join(feedback_parts)
    
    def evaluate_report(self, report_text: str, task_description: str = "") -> Dict[str, Any]:
        """
        Comprehensive report evaluation
        """
        try:
            # Perform all evaluations
            semantic_score = self.evaluate_semantic_similarity(report_text, task_description)
            grammar_results = self.evaluate_grammar_and_clarity(report_text)
            content_scores = self.evaluate_content_quality(report_text)
            
            # Calculate overall content score
            content_weights = {
                'technical_skills': 0.4,
                'professional_development': 0.3,
                'learning_outcomes': 0.3
            }
            overall_content = sum(content_scores.get(cat, 0.5) * weight 
                              for cat, weight in content_weights.items())
            
            # Final weighted score
            final_score = (
                semantic_score * 0.3 +
                overall_content * 0.4 +
                grammar_results['grammar_score'] * 0.2 +
                grammar_results['structure_score'] * 0.1
            )
            
            # Generate feedback
            feedback = self.generate_detailed_feedback({
                'content_quality': overall_content,
                'error_rate': grammar_results.get('error_rate', 5.0),
                'structure_score': grammar_results.get('structure_score', 0.5)
            })
            
            return {
                'ai_score': round(final_score, 3),
                'score_breakdown': {
                    'semantic_relevance': round(semantic_score, 3),
                    'content_quality': round(overall_content, 3),
                    'grammar_clarity': round(grammar_results.get('grammar_score', 0.5), 3),
                    'writing_structure': round(grammar_results.get('structure_score', 0.5), 3)
                },
                'detailed_analysis': {
                    'grammar': grammar_results,
                    'content': content_scores
                },
                'ai_feedback': feedback,
                'confidence_level': 0.85,
                'evaluation_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Report evaluation failed: {e}")
            return {
                'ai_score': 0.5,
                'ai_feedback': 'Evaluation service temporarily unavailable',
                'confidence_level': 0.0,
                'error': str(e)
            }

import json
from typing import Dict, Any

def evaluate_report(self, report_text: str, task_description: str = "") -> Dict[str, Any]:
    """Comprehensive report evaluation via Gemini NLP."""
    prompt = f"""
    Assess the student's weekly report based on the provided task description.
    Score from 0.0 to 1.0 on: semantic_relevance, content_quality, grammar_clarity, writing_structure.
    
    Task: "{task_description}"
    Report: "{report_text}"
    """
    
    response = self.model.generate_content(prompt)
    result_json = json.loads(response.text.strip())
    
    return {
        'ai_score': result_json.get('ai_score', 0.5),
        'score_breakdown': {
            'semantic_relevance': result_json.get('semantic_relevance', 0.5),
            'content_quality': result_json.get('content_quality', 0.5),
            'grammar_clarity': result_json.get('grammar_clarity', 0.5),
            'writing_structure': result_json.get('writing_structure', 0.5)
        },
        'ai_feedback': result_json.get('ai_feedback', "Good effort.")
    }

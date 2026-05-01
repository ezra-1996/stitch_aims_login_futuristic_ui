import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')

import django
django.setup()

from ai_services.nlp_evaluation.gemini_evaluator import AdvancedReportEvaluator
import json

evaluator = AdvancedReportEvaluator()

# Test report - a realistic weekly internship report
test_report = """
This week I completed the database migration task assigned by my supervisor. I implemented 
the new user authentication module using Django REST Framework and JWT tokens. The team had 
a meeting on Wednesday to discuss the project timeline and upcoming deadlines.

I learned how to write unit tests for API endpoints and achieved 85% code coverage. 
The main challenge I faced was handling edge cases in the file upload feature, but I found 
a solution by implementing chunked uploads.

I also participated in a code review session where I received feedback on my coding style. 
My goal for next week is to complete the dashboard analytics feature and improve the 
overall performance of the search functionality. I plan to research caching strategies 
to optimize database queries.

Communication with the team has been excellent. We use daily standups and Slack for 
quick updates. I feel my progress this week was significant and I am on track to meet 
the internship milestones.
"""

task_description = "Develop backend API features for the internship management system"

print("=" * 60)
print("AIMS Weekly Report AI Evaluation Test")
print("=" * 60)
print(f"\nReport length: {len(test_report.split())} words")
print(f"Task: {task_description}")
print("\nEvaluating...\n")

result = evaluator.evaluate_report(test_report, task_description)

print("=" * 60)
print("EVALUATION RESULTS")
print("=" * 60)
print(f"\nOverall Score: {result['ai_score']}/1.0  ({int(result['ai_score']*100)}%)")
print(f"Confidence:    {result['confidence_level']}")
if 'evaluation_method' in result:
    print(f"Method:        {result['evaluation_method']}")
print(f"\nScore Breakdown:")
for key, val in result['score_breakdown'].items():
    bar = "#" * int(val * 20) + "-" * (20 - int(val * 20))
    print(f"  {key:25s} [{bar}] {val:.2f}")
print(f"\nAI Feedback:\n  {result['ai_feedback']}")
print("=" * 60)

import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')

import django
django.setup()

from ai_services.nlp_evaluation.gemini_evaluator import AdvancedReportEvaluator
import json

evaluator = AdvancedReportEvaluator()

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

result = evaluator.evaluate_report(test_report, task_description)
print(json.dumps(result, indent=4))

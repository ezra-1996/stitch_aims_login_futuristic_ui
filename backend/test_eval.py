import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from evaluation.models import WeeklyReport
from ai_services import get_report_evaluator

print("Evaluating report...")
try:
    r = WeeklyReport.objects.first()
    if not r:
        print("No reports found!")
        exit()
    print("Found report:", r.report_id)
    evalr = get_report_evaluator()
    report_text = f"{r.title}\n{r.content}\n{r.tasks_completed}"
    print("Calling Gemini...")
    res = evalr.evaluate_report(report_text)
    print("Result:")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Error:", e)

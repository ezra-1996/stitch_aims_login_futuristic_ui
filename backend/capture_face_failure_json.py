import json

failure_response = {
    "success": False,
    "message": "VERIFICATION_FAILED: Face does not match registered profile. Confidence: 0.42 (Threshold: 0.65)",
    "status": "absent",
    "gps_info": "GPS Verified: Within 50m of Organization HQ (Demo Mode)"
}

print(json.dumps(failure_response, indent=4))

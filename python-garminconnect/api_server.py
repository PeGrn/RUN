#!/usr/bin/env python3
"""
🚀 Garmin Connect REST API Server
==================================

Flask API server exposing Garmin Connect data as REST endpoints
for consumption by Next.js or other frontend applications.

Usage:
    pip install flask flask-cors
    python api_server.py

Endpoints:
    GET /api/user                   - Get user information
    GET /api/stats/today            - Get today's stats
    GET /api/stats/date/<date>      - Get stats for specific date (YYYY-MM-DD)
    GET /api/heartrate/today        - Get today's heart rate data
    GET /api/heartrate/date/<date>  - Get heart rate for specific date
    GET /api/activities             - Get recent activities
    GET /api/hydration/today        - Get today's hydration data
    POST /api/login                 - Login with credentials (body: {email, password})
"""

import os
from datetime import date
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from garminconnect import (
    Garmin,
    GarminConnectAuthenticationError,
    GarminConnectConnectionError,
)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Global API instance
api = None
tokenstore = os.getenv("GARMINTOKENS", "~/.garminconnect")
tokenstore_path = Path(tokenstore).expanduser()


def get_api():
    """Get or initialize the Garmin API instance."""
    global api
    if api is None:
        try:
            api = Garmin()
            api.login(str(tokenstore_path))
        except Exception as e:
            return None, str(e)
    return api, None


def handle_api_error(func):
    """Decorator for handling API errors consistently."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except GarminConnectAuthenticationError:
            return jsonify({"error": "Authentication failed", "code": 401}), 401
        except GarminConnectConnectionError:
            return jsonify({"error": "Connection error", "code": 503}), 503
        except Exception as e:
            return jsonify({"error": str(e), "code": 500}), 500
    wrapper.__name__ = func.__name__
    return wrapper


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "Garmin Connect API"})


@app.route('/api/login', methods=['POST'])
def login():
    """Login with email and password."""
    global api

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    try:
        api = Garmin(email=email, password=password)
        api.login()
        api.garth.dump(str(tokenstore_path))

        return jsonify({
            "success": True,
            "message": "Login successful",
            "tokenPath": str(tokenstore_path)
        })
    except GarminConnectAuthenticationError as e:
        return jsonify({"error": "Invalid credentials", "details": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/user', methods=['GET'])
@handle_api_error
def get_user():
    """Get user information."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    full_name = api_instance.get_full_name()
    device_info = api_instance.get_device_last_used()

    return jsonify({
        "fullName": full_name,
        "profileNumber": device_info.get("userProfileNumber") if device_info else None,
        "deviceInfo": device_info
    })


@app.route('/api/stats/today', methods=['GET'])
@handle_api_error
def get_stats_today():
    """Get today's stats."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    today = date.today().isoformat()
    summary = api_instance.get_user_summary(today)

    return jsonify({
        "date": today,
        "steps": summary.get("totalSteps", 0),
        "distance": summary.get("totalDistanceMeters", 0),
        "calories": summary.get("totalKilocalories", 0),
        "floors": summary.get("floorsClimbed", 0),
        "activeMinutes": summary.get("activeMinutes", 0),
        "raw": summary
    })


@app.route('/api/stats/date/<date_str>', methods=['GET'])
@handle_api_error
def get_stats_date(date_str):
    """Get stats for a specific date (format: YYYY-MM-DD)."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    summary = api_instance.get_user_summary(date_str)

    return jsonify({
        "date": date_str,
        "steps": summary.get("totalSteps", 0),
        "distance": summary.get("totalDistanceMeters", 0),
        "calories": summary.get("totalKilocalories", 0),
        "floors": summary.get("floorsClimbed", 0),
        "activeMinutes": summary.get("activeMinutes", 0),
        "raw": summary
    })


@app.route('/api/heartrate/today', methods=['GET'])
@handle_api_error
def get_heartrate_today():
    """Get today's heart rate data."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    today = date.today().isoformat()
    hr_data = api_instance.get_heart_rates(today)

    return jsonify({
        "date": today,
        "restingHeartRate": hr_data.get("restingHeartRate"),
        "maxHeartRate": hr_data.get("maxHeartRate"),
        "minHeartRate": hr_data.get("minHeartRate"),
        "heartRateValues": hr_data.get("heartRateValues", []),
        "raw": hr_data
    })


@app.route('/api/heartrate/date/<date_str>', methods=['GET'])
@handle_api_error
def get_heartrate_date(date_str):
    """Get heart rate data for a specific date."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    hr_data = api_instance.get_heart_rates(date_str)

    return jsonify({
        "date": date_str,
        "restingHeartRate": hr_data.get("restingHeartRate"),
        "maxHeartRate": hr_data.get("maxHeartRate"),
        "minHeartRate": hr_data.get("minHeartRate"),
        "heartRateValues": hr_data.get("heartRateValues", []),
        "raw": hr_data
    })


@app.route('/api/activities', methods=['GET'])
@handle_api_error
def get_activities():
    """Get recent activities."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    # Get limit from query params (default: 10)
    limit = request.args.get('limit', 10, type=int)

    activities = api_instance.get_activities(0, limit)

    return jsonify({
        "activities": activities,
        "count": len(activities) if activities else 0
    })


@app.route('/api/hydration/today', methods=['GET'])
@handle_api_error
def get_hydration_today():
    """Get today's hydration data."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    today = date.today().isoformat()
    hydration = api_instance.get_hydration_data(today)

    return jsonify({
        "date": today,
        "valueInML": hydration.get("valueInML", 0),
        "goalInML": hydration.get("goalInML", 0),
        "valueInCups": round(hydration.get("valueInML", 0) / 240, 1),
        "raw": hydration
    })


@app.route('/api/sleep/today', methods=['GET'])
@handle_api_error
def get_sleep_today():
    """Get today's sleep data."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    today = date.today().isoformat()
    sleep_data = api_instance.get_sleep_data(today)

    return jsonify({
        "date": today,
        "sleepData": sleep_data
    })


@app.route('/api/stress/today', methods=['GET'])
@handle_api_error
def get_stress_today():
    """Get today's stress data."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    today = date.today().isoformat()
    stress_data = api_instance.get_stress_data(today)

    return jsonify({
        "date": today,
        "stressData": stress_data
    })


@app.route('/api/body-composition', methods=['GET'])
@handle_api_error
def get_body_composition():
    """Get latest body composition data."""
    api_instance, error = get_api()
    if error:
        return jsonify({"error": error}), 401

    today = date.today().isoformat()
    body_comp = api_instance.get_body_composition(today)

    return jsonify({
        "date": today,
        "bodyComposition": body_comp
    })


if __name__ == '__main__':
    print("🚀 Starting Garmin Connect REST API Server")
    print("=" * 60)
    print("📍 Server running on: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/api/health")
    print("=" * 60)
    print("\nAvailable endpoints:")
    print("  GET  /api/health")
    print("  POST /api/login")
    print("  GET  /api/user")
    print("  GET  /api/stats/today")
    print("  GET  /api/stats/date/<date>")
    print("  GET  /api/heartrate/today")
    print("  GET  /api/heartrate/date/<date>")
    print("  GET  /api/activities?limit=10")
    print("  GET  /api/hydration/today")
    print("  GET  /api/sleep/today")
    print("  GET  /api/stress/today")
    print("  GET  /api/body-composition")
    print("\n💡 Make sure you have valid tokens in ~/.garminconnect")
    print("   or call POST /api/login with your credentials first")
    print("=" * 60)

    app.run(debug=True, host='0.0.0.0', port=5000)

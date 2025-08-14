# backend/routes.py
from flask import Blueprint, request, jsonify, send_file, current_app
import io
import time
import traceback

# Absolute imports so `python app.py` on Render works from the backend folder root
from document_generator import generate_docx_from_data, generate_pdf_from_data
from file_parser import parse_resume_file
from gemini_utils import generate_elevator_pitch  # your Gemini helper

# Create a Blueprint for API routes
api_bp = Blueprint("api", __name__)

# -----------------------------
# Resume Parsing Endpoint
# -----------------------------
@api_bp.route("/parse-resume", methods=["POST"])
def parse_resume_route():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        result = parse_resume_file(file)
        if isinstance(result, dict) and "error" in result:
            return jsonify(result), 500
        return jsonify(result), 200
    except Exception:
        current_app.logger.error(
            "Unexpected error in /api/parse-resume:\n%s", traceback.format_exc()
        )
        return jsonify({"error": "INTERNAL_PARSE_ERROR"}), 500


# -----------------------------
# DOCX Generation Endpoint
# -----------------------------
@api_bp.route("/generate-docx", methods=["POST"])
def generate_docx_route():
    try:
        # Force JSON so we fail fast with clear error when body isn't JSON
        payload = request.get_json(force=True, silent=False) or {}
        # Our generator already returns a BytesIO ready for send_file
        buf = generate_docx_from_data(payload)

        # File name: prefer name from payload, fallback with timestamp
        personal = payload.get("personal", {}) if isinstance(payload, dict) else {}
        base = (personal.get("name") or "resume").strip() or "resume"
        safe_base = "_".join(base.split())
        filename = f"{safe_base}.docx"

        return send_file(
            buf,
            as_attachment=True,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception:
        current_app.logger.error(
            "DOCX generation failed:\n%s", traceback.format_exc()
        )
        return jsonify({"error": "DOCX_GENERATION_FAILED"}), 500


# -----------------------------
# PDF Generation Endpoint
# -----------------------------
@api_bp.route("/generate-pdf", methods=["POST"])
def generate_pdf_route():
    try:
        payload = request.get_json(force=True, silent=False) or {}
        pdf_bytes = generate_pdf_from_data(payload)

        personal = payload.get("personal", {}) if isinstance(payload, dict) else {}
        base = (personal.get("name") or "resume").strip() or "resume"
        safe_base = "_".join(base.split())
        filename = f"{safe_base}.pdf"

        return send_file(
            io.BytesIO(pdf_bytes),
            as_attachment=True,
            download_name=filename,
            mimetype="application/pdf",
        )
    except Exception:
        current_app.logger.error(
            "PDF generation failed:\n%s", traceback.format_exc()
        )
        return jsonify({"error": "PDF_GENERATION_FAILED"}), 500


# -----------------------------
# Elevator Pitch Endpoint
# -----------------------------
@api_bp.route("/generate-elevator-pitch", methods=["POST"])
def generate_elevator_pitch_route():
    try:
        payload = request.get_json(force=True, silent=False) or {}

        # Accept { "resumeData": ... }, { "parsedData": ... } or the raw object
        resume_data = payload.get("resumeData") or payload.get("parsedData") or payload

        if not isinstance(resume_data, dict) or not resume_data:
            return jsonify({"error": "Missing or invalid resume data"}), 400

        pitch = generate_elevator_pitch(resume_data)
        pitch_text = pitch if isinstance(pitch, str) else ""

        return jsonify({"elevatorPitch": pitch_text}), 200
    except Exception:
        current_app.logger.error(
            "Elevator pitch generation failed:\n%s", traceback.format_exc()
        )
        return jsonify({"error": "ELEVATOR_PITCH_FAILED"}), 500

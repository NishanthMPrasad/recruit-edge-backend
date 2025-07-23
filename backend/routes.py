# backend/routes.py
from flask import request, jsonify, send_file, Blueprint
import io

# Make sure these functions are correctly imported from your other files
from .document_generator import generate_docx_from_data, generate_pdf_from_data
from .file_parser import parse_resume_file
from .gemini_utils import generate_elevator_pitch # Changed to import from gemini_utils

# Create a Blueprint for API routes
api_bp = Blueprint('api', __name__)

# --- Resume Parsing Endpoint ---
@api_bp.route('/parse-resume', methods=['POST'])
def parse_resume_route():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file:
        try:
            result = parse_resume_file(file)
            if "error" in result:
                return jsonify(result), 500
            
            return jsonify(result), 200

        except Exception as e:
            print(f"An unexpected error occurred in /api/parse-resume: {e}")
            return jsonify({"error": "An internal server error occurred during parsing."}), 500
    
    return jsonify({"error": "An unknown error occurred"}), 500


# --- Document Generation Endpoints ---
@api_bp.route('/generate-docx', methods=['POST'])
def generate_docx_route():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    resume_data = request.json
    try:
        doc = generate_docx_from_data(resume_data)
        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)
        
        personal_info = resume_data.get('personal', {})
        filename = f"{personal_info.get('name', 'resume').replace(' ', '_')}.docx"
        
        return send_file(
            file_stream,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        print(f"Error generating DOCX: {e}")
        return jsonify({"error": "An internal error occurred while generating the DOCX file."}), 500


@api_bp.route('/generate-pdf', methods=['POST'])
def generate_pdf_route():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    resume_data = request.json
    try:
        pdf_bytes = generate_pdf_from_data(resume_data)
        
        personal_info = resume_data.get('personal', {})
        filename = f"{personal_info.get('name', 'resume').replace(' ', '_')}.pdf"

        return send_file(
            io.BytesIO(pdf_bytes),
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return jsonify({"error": "An internal error occurred while generating the PDF file."}), 500

# --- NEW: Elevator Pitch Generation Endpoint ---
@api_bp.route('/generate-elevator-pitch', methods=['POST'])
def generate_elevator_pitch_route():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    resume_data = request.json
    try:
        pitch = generate_elevator_pitch(resume_data) # Now calls the function from gemini_utils
        return jsonify({"elevatorPitch": pitch}), 200
    except Exception as e:
        print(f"Error generating elevator pitch: {e}")
        return jsonify({"error": "An internal error occurred while generating the elevator pitch."}), 500
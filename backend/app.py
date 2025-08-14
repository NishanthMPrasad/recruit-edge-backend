'''
# backend/app.py
from flask import Flask
from flask_cors import CORS
from .routes import api_bp # Import the blueprint

app = Flask(__name__)

# This allows your React app (e.g., from localhost:5173) to make requests to your Flask app (at localhost:5000)
CORS(app) 

# Register the blueprint
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
'''
'''
# backend/app.py
from flask import Flask
from flask_cors import CORS
from routes import api_bp

import os

app = Flask(__name__)

# This allows your React app to make requests to your Flask app
CORS(app)

# Register the blueprint
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
'''
from flask import Flask, request
from flask_cors import CORS
from routes import api_bp  # Import the blueprint
import os

app = Flask(__name__)

# Allow only your Vercel production domain (safer) — change to "*" for full access during testing
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://recruit-edge-h7uwejvtl-nishanths-projects-4cb8bf5d.vercel.app"
        ]
    }
})

# Log every incoming request to help debug
@app.before_request
def log_request_info():
    print(f"[REQUEST] {request.method} {request.path} from {request.remote_addr}")

# Register your API blueprint under /api
app.register_blueprint(api_bp, url_prefix='/api')

# Root route so visiting the base URL won't return 404
@app.route('/')
def home():
    return {
        "status": "Backend running successfully!",
        "message": "RecruitEdge API is live 🚀"
    }, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)




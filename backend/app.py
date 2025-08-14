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


import io
import os
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

# Set the static folder path to your built frontend (adjust as needed)
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')
app = Flask(__name__, static_folder=static_folder, static_url_path='')
CORS(app)  # You may remove this if not needed in production

@app.route('/api/download', methods=['POST'])
def download_audio():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Create a temporary directory for the download
    with tempfile.TemporaryDirectory() as tmpdirname:
        output_file = os.path.join(tmpdirname, 'downloaded.mp3')
        cmd = [
            'yt-dlp',
            '--audio-format', 'mp3',
            '--cookies', 'cookies.txt',
            '-x',
            '-o', output_file,
            url
        ]
        # Run the yt-dlp command and capture its output
        result = subprocess.run(cmd, capture_output=True, text=True)

        # Log the output to the backend console
        print("yt-dlp stdout:\n", result.stdout)
        print("yt-dlp stderr:\n", result.stderr)

        if result.returncode != 0:
            return jsonify({
                "error": "yt-dlp failed",
                "details": result.stderr
            }), 500

        # Read the generated mp3 file into memory
        with open(output_file, 'rb') as f:
            file_data = f.read()

    # Return the file as a downloadable response
    return send_file(
        io.BytesIO(file_data),
        mimetype='audio/mpeg',
        as_attachment=True,
        download_name='downloaded.mp3'
    )

# Serve static files for the frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # If a file matching the path exists, serve it; otherwise serve index.html
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # In production, use a production WSGI server (like Gunicorn) instead of app.run()
    app.run(debug=False, host='0.0.0.0')

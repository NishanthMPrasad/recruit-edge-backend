# backend/gemini_utils.py
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini API with your key
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file.")
    genai.configure(api_key=api_key)
except Exception as e:
    print(f"Error configuring Gemini API: {e}")

def structure_text_with_ai(raw_resume_text: str) -> dict:
    """
    Uses the Gemini model to parse raw resume text into a structured JSON object.

    Args:
        raw_resume_text: A string containing the full text from the resume.

    Returns:
        A dictionary with the structured resume data.
    """

    json_schema = """
    {
      "personal": {"name": "", "email": "", "phone": "", "location": "", "legalStatus": ""},
      "summary": "",
      "experience": [
        {"id": "string", "jobTitle": "", "company": "", "dates": "", "description": ""}
      ],
      "education": [
        {"id": "string", "degree": "", "institution": "", "graduationYear": "", "gpa": "", "achievements": ""}
      ],
      "skills": [
        {"id": "string", "category": "", "skills_list": ""}
      ],
      "projects": [
        {"id": "string", "title": "", "date": "", "description": ""}
      ],
      "publications": [
        {"id": "string", "title": "", "authors": "", "journal": "", "date": "", "link": ""}
      ],
      "certifications": [
        {"id": "string", "name": "", "issuer": "", "date": ""}
      ]
    }
    """

    # --- UPDATED PROMPT FOR SKILLS CATEGORIZATION ---
    prompt = f"""
    You are an expert resume parsing assistant. Analyze the following raw text extracted from a resume and convert it into a structured JSON object.
    The JSON object must follow this exact schema.
    Do not add any fields that are not in the schema. Do not enclose the JSON in markdown backticks.

    For the 'summary', 'description', and 'achievements' fields, if the original text contains bullet points, format them as an unordered HTML list (`<ul><li>...</li><li>...</li></ul>`). If the original text contains paragraphs, format them as HTML paragraphs (`<p>...</p>`). If text is bold or italic, use `<strong>` or `<em>` HTML tags. Ensure nested structures are correctly represented in HTML.

    For the 'skills' array:
    - Identify distinct skill categories (e.g., "Programming Languages", "Tools", "Cloud Platforms", "Soft Skills", "Databases", "Operating Systems", "Frameworks", "Libraries").
    - For each identified category, create a separate object within the 'skills' array.
    - Populate the 'category' field with the inferred category name.
    - Populate the 'skills_list' field with the relevant skills for that category. The 'skills_list' should be plain text, comma-separated. If skills were presented in subsections in the original resume, ensure a newline character (`\\n`) separates each distinct group within the 'skills_list'. Do NOT use any HTML tags (`<p>`, `<ul>`, `<li>`, `<strong>`, `<em>`) for 'skills_list'.
    - If skills are listed without explicit categories, group them under a general category like "Technical Skills" or "Key Skills".

    If a section (like 'projects' or 'publications') is not present in the text, provide an empty list for that key.

    **JSON Schema to follow:**
    ```json
    {json_schema}
    ```

    **Raw Resume Text to Parse:**
    ```
    {raw_resume_text}
    ```
    """

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        cleaned_json_string = response.text.strip().replace('```json', '').replace('```', '').strip()
        structured_data = json.loads(cleaned_json_string)

        return structured_data

    except Exception as e:
        print(f"An error occurred while calling the Gemini API or parsing its response: {e}")
        # Return a default empty structure on error to prevent frontend crashes
        return {
            "personal": {},
            "summary": "",
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
            "publications": [],
            "certifications": []
        }

# --- NEW: Elevator Pitch Function for Gemini ---
def generate_elevator_pitch(resume_data: dict) -> str:
    """Generates a concise elevator pitch from resume data using Gemini."""

    # Extract relevant info from resume_data
    personal = resume_data.get('personal', {})
    summary = resume_data.get('summary', '')
    experience = resume_data.get('experience', [])
    skills = resume_data.get('skills', [])
    education = resume_data.get('education', [])
    projects = resume_data.get('projects', [])

    # Concatenate relevant information for the prompt
    context_parts = []
    if personal.get('name'):
        context_parts.append(f"Name: {personal['name']}")
    if personal.get('jobTitle'):
        context_parts.append(f"Current Role: {personal['jobTitle']}")
    if summary:
        # Strip HTML from summary for pitch generation, as pitch should be plain text
        from bs4 import BeautifulSoup
        clean_summary = BeautifulSoup(summary, 'html.parser').get_text(separator=' ')
        context_parts.append(f"Summary: {clean_summary}")

    if experience:
        exp_strings = []
        for exp in experience:
            # Strip HTML from description for pitch generation
            from bs4 import BeautifulSoup
            clean_description = BeautifulSoup(exp.get('description', ''), 'html.parser').get_text(separator=' ')
            exp_strings.append(f"- {exp.get('jobTitle', '')} at {exp.get('company', '')} ({exp.get('dates', '')}). Description: {clean_description}")
        context_parts.append("Experience:\n" + "\n".join(exp_strings))

    if skills:
        skill_strings = []
        for skill_cat in skills:
            if skill_cat.get('category') and skill_cat.get('skills_list'):
                # skills_list is now expected to be plain text, so no need to strip HTML
                skill_strings.append(f"- {skill_cat['category']}: {skill_cat['skills_list']}")
            elif skill_cat.get('skills_list'):
                # skills_list is now expected to be plain text
                skill_strings.append(f"- {skill_cat['skills_list']}")
        context_parts.append("Skills:\n" + "\n".join(skill_strings)) # Join by newline as requested for plain text skills

    if projects:
        proj_strings = []
        for proj in projects:
            # Strip HTML from description for pitch generation
            from bs4 import BeautifulSoup
            clean_description = BeautifulSoup(proj.get('description', ''), 'html.parser').get_text(separator=' ')
            proj_strings.append(f"- {proj.get('title', '')} ({proj.get('date', '')}). Description: {clean_description}")
        context_parts.append("Projects:\n" + "\n".join(proj_strings))

    if education:
        edu_strings = []
        for edu in education:
            # Strip HTML from achievements for pitch generation
            from bs4 import BeautifulSoup
            clean_achievements = BeautifulSoup(edu.get('achievements', ''), 'html.parser').get_text(separator=' ')
            edu_strings.append(f"- {edu.get('degree', '')} from {edu.get('institution', '')} ({edu.get('graduationYear', '')}). Achievements: {clean_achievements}")
        context_parts.append("Education:\n" + "\n".join(edu_strings))


    full_context = "\n\n".join(context_parts)

    prompt = f"""
    Based on the following resume data, generate a compelling and concise 30-second elevator pitch.
    The pitch should be professional, engaging, and highlight the candidate's key strengths, experiences, and career goals.
    Focus on what makes the candidate unique and valuable.
    Keep it under 100 words.

    Resume Details:
    ---
    {full_context}
    ---

    Elevator Pitch:
    """

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini for elevator pitch: {e}")
        return "Could not generate elevator pitch at this time."

def enhance_section_with_ai(section_name, text_to_enhance):
    """
    Enhances a given text section using a generative AI model.

    Args:
        section_name (str): The name of the section (e.g., "Summary", "Experience Description").
        text_to_enhance (str): The original text content to be enhanced.

    Returns:
        list: A list of enhanced versions of the text.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Adjust prompt based on section name
        if section_name.lower() == 'skills':
            prompt_instruction = """
            Rewrite the following skills list to be more organized and impactful.
            Maintain the categorization (e.g., "Programming Languages:"). Separate different categories or groups of skills with a newline character. Do NOT use any HTML tags (like <p>, <ul>, <li>, <strong>, <em>).
            Provide 3 different versions. Return each version on a new line.
            """
        else: # For other sections like Summary, Experience Description, Education Achievements
            prompt_instruction = """
            Rewrite the following {section_name} to be more impactful, professional, and concise.
            If the original text contains bullet points, format them as an unordered HTML list (`<ul><li>...</li><li>...</li></li></ul>`). If the original text contains paragraphs, format them as HTML paragraphs (`<p>...</p>`). If text should be bold or italic, use `<strong>` or `<em>` HTML tags. Ensure nested structures are correctly represented in HTML.
            Provide 3 different versions. Return each version on a new line.
            """

        prompt = f"""
        {prompt_instruction}

        Original {section_name}:
        {text_to_enhance}

        Enhanced Versions:
        """
        response = model.generate_content(prompt)
        return [version.strip() for version in response.text.split('\n') if version.strip()]
    except Exception as e:
        print(f"Error enhancing section with AI: {e}")
        return [text_to_enhance]
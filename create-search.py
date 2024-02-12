import json
import requests
from dotenv import load_dotenv
import os

load_dotenv()


MS_PORT = os.getenv("MS_PORT")
MS_MASTER_KEY = os.getenv("MS_MASTER_KEY")
with open(
    "./backend/src/timetable.json",
    "r",
) as file:
    courses = json.load(file)
    courses = courses["courses"]
    search = []
    for course in courses:
        required = {}
        required["course_code"] = "_".join(course.split(" "))
        required["course_name"] = courses[course]["course_name"]
        search.append(required)
    requests.post(
        f"http://localhost:{MS_PORT}/indexes/courses/documents?primaryKey=course_code",
        headers={
            "Authorization": f"Bearer {MS_MASTER_KEY}",
        },
        json=search,
    )

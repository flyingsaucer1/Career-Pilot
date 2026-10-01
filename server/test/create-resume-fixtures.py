"""Deterministic synthetic fixtures, containing no real candidate information."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

fixtures = Path(__file__).parent / "fixtures"
fixtures.mkdir(exist_ok=True)
document = canvas.Canvas(str(fixtures / "synthetic-resume.pdf"), pagesize=A4, invariant=1)
document.setTitle("Synthetic resume - CareerPilot integration test")
document.setFont("Helvetica-Bold", 20)
document.drawString(54, 780, "Alex Example")
document.setFont("Helvetica", 10)
document.drawString(54, 758, "Synthetic test candidate | alex@example.test | No real personal data")
sections = [
    ("SUMMARY", ["Frontend developer building accessible React applications and reliable REST APIs."]),
    ("SKILLS", ["React, TypeScript, Node.js, MongoDB, Git, HTML, CSS, Python"]),
    ("EXPERIENCE", ["Demo Software Lab | Frontend Intern | January 2025 - June 2025",
                    "Built three responsive React dashboards with TypeScript and reusable components.",
                    "Created Node.js REST APIs backed by MongoDB and documented 12 endpoints.",
                    "Collaborated with four teammates and reviewed pull requests using Git."]),
    ("PROJECTS", ["Accessible Task Manager | React, TypeScript, Node.js",
                  "Implemented keyboard navigation, form validation, and automated API tests."]),
    ("EDUCATION", ["B.Sc. Computer Science | Example University | 2025"]),
]
y = 722
for heading, lines in sections:
    document.setFont("Helvetica-Bold", 11)
    document.drawString(54, y, heading)
    y -= 22
    document.setFont("Helvetica", 10)
    for line in lines:
        document.drawString(54, y, line)
        y -= 17
    y -= 21
document.save()
blank = canvas.Canvas(str(fixtures / "blank-resume.pdf"), pagesize=A4, invariant=1)
blank.showPage()
blank.save()
print("Created synthetic and blank PDF fixtures.")

from app import create_app, db
from app.models.links_model import Link

app = create_app()

with app.app_context():
    db.create_all()
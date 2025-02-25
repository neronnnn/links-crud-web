from flask import Blueprint, render_template

from app.models.links_model import Links

main = Blueprint('main', __name__, template_folder='../templates/main')

@main.route('/')
def index():
    links = Links.query.all()
    return render_template('index.html', links=links)
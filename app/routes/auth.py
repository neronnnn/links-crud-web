from flask import Blueprint, render_template, url_for, redirect, request, session
from werkzeug.security import check_password_hash

from app.config import Config
#from app.models.links_model import Links

auth = Blueprint('auth', __name__, template_folder='../templates/auth')

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form['user'] == Config.ADMIN_USER and check_password_hash(Config.ADMIN_PASSWORD, request.form['password']):
            session['admin'] = True
            return redirect(url_for('admin.links_CRUD'))

    return render_template('login.html')

@auth.route('/logout')
def logout():
    session.pop('admin', None)
    return redirect(url_for('auth.login'))
from flask import render_template, flash, redirect, url_for
from app import app, db
from app.models import SatelliteCollection

@app.route('/')
@app.route('/index')
def index():
    
    return render_template('index.html', title='Home')



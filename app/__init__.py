from flask import Flask
from flask_bootstrap import Bootstrap5
import os
from flask_sqlalchemy import SQLAlchemy
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'you-will-never-guess'

db = SQLAlchemy(app)

bootstrap = Bootstrap5(app)

from app import routes, routes_collections, routes_satellites, routes_observers, routes_jsapi
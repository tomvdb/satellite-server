from flask import Flask
from flask_bootstrap import Bootstrap5
import os
from flask_sqlalchemy import SQLAlchemy
from app import config_functions

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'you-will-never-guess'

db = SQLAlchemy(app)


# config file
config = config_functions.Config()
config_file = os.path.join(basedir, 'config.json')

if os.path.isfile(config_file):
    config.load_config(config_file)
else:
    config.create_empty_config(config_file)
    config.save_config()

print(config.config_data)

bootstrap = Bootstrap5(app)

from app import routes, routes_collections, routes_satellites, routes_jsapi
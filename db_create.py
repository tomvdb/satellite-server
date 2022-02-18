from app import db
from app.models import Satellite, SatelliteCollection,

db.create_all()

col = SatelliteCollection(collection_name = 'Default')
db.session.add(col)
db.session.commit()


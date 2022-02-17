from app import db
from sqlalchemy.orm import relationship

class SatelliteCollection(db.Model):
    __tablename__ = 'satellite_collection'    

    collection_id = db.Column(db.Integer, primary_key=True)
    collection_name = db.Column(db.Text, nullable=False, unique=True) 

    def __repr__(self):
        return '<Collection {}>'.format(self.collection_name)

class SatelliteCollectionAssignmment(db.Model):
    __tablename__ = 'satellite_collection_assignment'    

    id = db.Column(db.Integer, primary_key=True)
    collection_id = db.Column(db.Integer,db.ForeignKey('satellite_collection.collection_id'),nullable=False)
    satellite_id = db.Column(db.Integer,db.ForeignKey('satellite.satellite_id'),nullable=False)

    Collection = relationship("SatelliteCollection")
    Satellite = relationship("Satellite")

class Satellite(db.Model):
    __tablename__ = 'satellite'    

    satellite_id = db.Column(db.Integer, primary_key=True)
    satellite_name = db.Column(db.Text, nullable=False)
    satellite_norad_id = db.Column(db.BigInteger)
    satellite_tle0 = db.Column(db.Text, nullable=False)
    satellite_tle1 = db.Column(db.Text, nullable=False)
    satellite_tle2 = db.Column(db.Text, nullable=False)
    tle_updated = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return '<Satellite {}>'.format(self.satellite_name)

class Observer(db.Model):
    __tablename__ = "observer"

    observer_id = db.Column(db.Integer, primary_key=True)
    observer_name = db.Column(db.Text, nullable=False)
    observer_latitude = db.Column(db.Text, nullable=False)
    observer_longitude = db.Column(db.Text, nullable=False)    
    observer_elevation = db.Column(db.Integer, nullable=False)
    observer_default = db.Column(db.Integer, nullable=False)
    
    def __repr__(self):
        return '<Observer {}>'.format(self.observer_name)

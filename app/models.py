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

class SatelliteTransmitter(db.Model):
    __tablename__ = 'satellite_transmitter'    

    transmitter_id = db.Column(db.Integer, primary_key=True)
    satellite_norad_id = db.Column(db.BigInteger, nullable=False)
    transmitter_description = db.Column(db.Text)
    transmitter_alive = db.Column(db.Boolean)
    transmitter_type = db.Column(db.Text)
    transmitter_uplink_low = db.Column(db.BigInteger)
    transmitter_uplink_high = db.Column(db.BigInteger)
    transmitter_uplink_mode = db.Column(db.Text)
    transmitter_downlink_low = db.Column(db.BigInteger)
    transmitter_downlink_high = db.Column(db.BigInteger)
    transmitter_downlink_mode = db.Column(db.Text)
    transmitter_invert = db.Column(db.Boolean)
    transmitter_baud = db.Column(db.BigInteger)
    transmitter_citation = db.Column(db.Text)
    transmitter_coordination = db.Column(db.Text)
    transmitter_coordination_url = db.Column(db.Text)

    


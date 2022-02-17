from flask import jsonify
from app import app, db
from app.models import Satellite, SatelliteCollection, SatelliteCollectionAssignmment, Observer
from app.forms import CreateCollectionForm, AddSatelliteCollectionForm
from sqlalchemy import and_

from app.satellite_functions import calc_current_pos, get_next_pass, get_orbit

@app.route('/browser/satellite_data/<collection_id>')
def satellite_data(collection_id):    
    collection = SatelliteCollection.query.filter_by(collection_id=collection_id).first()

    data = { 'success' : False }

    if collection == None:
        return jsonify({ 'success' : False, 'message' : 'Collection not found'})

    data['collection_name'] = collection.collection_name

    # get default observer
    observer = Observer.query.filter_by(observer_default=1).first()

    if observer == None:
        return jsonify({ 'success' : False, 'message' : 'No default observer'})

    data['observer'] = {}
    data['observer']['coordinates'] = (float(observer.observer_latitude), float(observer.observer_longitude))

    # get satellites in this collection
    satCollection = SatelliteCollectionAssignmment.query.filter_by(collection_id=collection_id).all()

    data['satellites'] = []

    # def calc_current_pos(tle0, tle1, tle2, latitude, longitude, horizon):

    for sat in satCollection:
        satellite = sat.Satellite
        satObject = {}
        satObject['title'] = satellite.satellite_tle0
        satObject['tle1'] = satellite.satellite_tle1
        satObject['tle2'] = satellite.satellite_tle2

        next_pass = get_next_pass(satellite.satellite_tle0, satellite.satellite_tle1, satellite.satellite_tle2, float(observer.observer_latitude), float(observer.observer_longitude), 0)        
        satObject['next_pass'] = next_pass


        data['satellites'].append(satObject)

    data['success'] = True
    return jsonify(data)


    



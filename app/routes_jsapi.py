from flask import jsonify
from app import app, db
from app.models import Satellite, SatelliteCollection, SatelliteCollectionAssignmment,SatelliteTransmitter
from app.forms import CreateCollectionForm, AddSatelliteCollectionForm
from sqlalchemy import and_
from app import config
import requests

from app.satellite_functions import calc_current_pos, get_next_pass, get_orbit

@app.route('/browser/satellite_data/<collection_id>')
def satellite_data(collection_id):    
    collection = SatelliteCollection.query.filter_by(collection_id=collection_id).first()

    data = { 'success' : False }

    if collection == None:
        return jsonify({ 'success' : False, 'message' : 'Collection not found'})

    data['collection_name'] = collection.collection_name

    data['observer'] = {}
    data['observer']['coordinates'] = (float(config.config_data['qth_latitude']), float(config.config_data['qth_longitude']))

    # get satellites in this collection
    satCollection = SatelliteCollectionAssignmment.query.filter_by(collection_id=collection_id).all()

    data['satellites'] = []

    # def calc_current_pos(tle0, tle1, tle2, latitude, longitude, horizon):

    for sat in satCollection:
        satellite = sat.Satellite
        satObject = {}
        satObject['dbid'] = satellite.satellite_id
        satObject['title'] = satellite.satellite_tle0
        satObject['tle1'] = satellite.satellite_tle1
        satObject['tle2'] = satellite.satellite_tle2
        satObject['transmitters'] = []

        # do we have any transmitters for this satellite ?
        transmitterData = SatelliteTransmitter.query.filter_by(satellite_norad_id=satellite.satellite_norad_id).all()

        for item in transmitterData:
            satObject['transmitters'].append({
                'description' : item.transmitter_description,
                'type' : item.transmitter_type,
                'uplink_low' : item.transmitter_uplink_low,
                'uplink_high' : item.transmitter_uplink_high,
                'uplink_mode' : item.transmitter_uplink_mode,
                'downlink_low' : item.transmitter_downlink_low,
                'downlink_high' : item.transmitter_downlink_high,
                'downlink_mode' : item.transmitter_downlink_mode,
                'invert' : item.transmitter_invert,
                'baud' : item.transmitter_baud,
                'citation' : item.transmitter_citation,
                'coordination' : item.transmitter_coordination,
                'coordination_url' : item.transmitter_coordination_url,
            })

        data['satellites'].append(satObject)

    data['success'] = True
    return jsonify(data)


@app.route('/browser/tle_api/<norad_id>')
def tle_api(norad_id):  
    req = requests.get("https://db.satnogs.org/api/tle/?format=json&norad_cat_id=" + norad_id)

    if req.status_code == 200:        
        data = req.json()
        return jsonify(data)

    return jsonify([{}])

'''
@app.route('/browser/transmitter_api/<norad_id>')
def transmitter_api(norad_id):  
    req = requests.get("https://db.satnogs.org/api/transmitters/?alive=true&format=json&satellite__norad_cat_id=" + norad_id)

    if req.status_code == 200:        
        data = req.json()
        return jsonify(data)

    return jsonify([{}])
'''

from flask import render_template, flash, redirect, url_for
from app import app, db
from app.models import Satellite, SatelliteCollection, SatelliteCollectionAssignmment
from datetime import datetime
from skyfield.api import load, wgs84, EarthSatellite, Distance
from app.forms import CreateSatelliteForm
from app import config
from app.satellite_functions import calc_future_passes, get_satellite_record



@app.route('/view_satellites')
def view_satellites():    
    satellites = Satellite.query.all()
    ts = load.timescale()

    satlist = []
    for sat in satellites:
        satRecord = get_satellite_record(sat.satellite_tle0, sat.satellite_tle1, sat.satellite_tle2)
        
        satObject = {}
        satObject['satellite_id'] = sat.satellite_id
        satObject['satellite_name'] = sat.satellite_name
        
        days = ts.now() - satRecord.epoch

        if abs(days) > 10:
            satObject['outdated'] = True
        else:
            satObject['outdated'] = False

        satObject['satellite_epoch_days'] = days
        satObject['satellite_collection'] = []

        # get collections for this sat
        collections = SatelliteCollectionAssignmment.query.filter_by(satellite_id=sat.satellite_id).all()
        for collection in collections:
            satObject['satellite_collection'].append(collection.Collection.collection_name)

        satlist.append(satObject)

    return render_template('satellites.html', title='Satellites', satellites = satlist)

@app.route('/add_satellite', methods=['GET', 'POST'])
def add_satellite():    
    form = CreateSatelliteForm()

    if form.validate_on_submit():
        checkExists = Satellite.query.filter_by(satellite_name= form.satellite_name.data).first()
        
        if checkExists != None:
            flash(form.satellite_name.data + " already exists", 'warning')
        else:
            newSat = Satellite(
                satellite_name = form.satellite_name.data,
                satellite_norad_id  = form.satellite_norad_id.data,
                satellite_tle0 = form.satellite_tle0.data,
                satellite_tle1 = form.satellite_tle1.data,
                satellite_tle2 = form.satellite_tle2.data,
                tle_updated = datetime.now()
            )

            db.session.add(newSat)
            db.session.commit()

            return redirect(url_for('view_satellites'))        

    return render_template('add_satellite_form.html', title='Add Satellite',  form = form)

@app.route('/edit_satellite/<satellite_id>', methods=['GET', 'POST'])
def edit_satellite(satellite_id):    
    satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
    
    if satellite == None:
        flash("Sorry, that satellite doesn't exist")
        return redirect(url_for('view_satellites'))    

    form = CreateSatelliteForm()

    if form.validate_on_submit():
        satellite.satellite_name = form.satellite_name.data
        satellite.satellite_norad_id  = form.satellite_norad_id.data
        satellite.satellite_tle0 = form.satellite_tle0.data
        satellite.satellite_tle1 = form.satellite_tle1.data
        satellite.satellite_tle2 = form.satellite_tle2.data

        db.session.add(satellite)
        db.session.commit()

        flash( "Satellite has been updated")
        return redirect(url_for('view_satellites'))        

    form.satellite_name.data = satellite.satellite_name
    form.satellite_norad_id.data = satellite.satellite_norad_id
    form.satellite_tle0.data = satellite.satellite_tle0
    form.satellite_tle1.data = satellite.satellite_tle1
    form.satellite_tle2.data = satellite.satellite_tle2

    return render_template('add_satellite_form.html', title='Add Satellite',  form = form)


@app.route('/delete_satellite/<satellite_id>', methods=['GET', 'POST'])
def delete_satellite(satellite_id):
    sat = Satellite.query.filter_by(satellite_id=satellite_id).first()

    if sat == None:
        flash("Nothing to remove - satellite id invalid")

    satCollection = SatelliteCollectionAssignmment.query.filter_by(satellite_id=satellite_id).all()

    for item in satCollection:
        db.session.delete(item)

    db.session.delete(sat)

    db.session.commit()

    flash("Satellite Removed")

    return redirect(url_for('view_satellites'))        

@app.route('/view_satellite/<satellite_id>', methods=['GET', 'POST'])
def view_satellite(satellite_id):
    satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()

    if satellite == None:
        flash("Error: Satellite not found", "error")
        return redirect(url_for('view_satellites'))        

    # get default observer
    future_passes = calc_future_passes(satellite.satellite_tle0, satellite.satellite_tle1, satellite.satellite_tle2, float(config.config_data['qth_latitude']), float(config.config_data['qth_longitude']), 10, 5)

    print(future_passes)
    
    return render_template('view_satellite.html', title='Satellite Name', satellite = satellite, future_passes = future_passes)


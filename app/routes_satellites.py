from flask import render_template, flash, redirect, url_for
from app import app, db
from app.models import Satellite, SatelliteCollection, SatelliteCollectionAssignmment,  Observer
from datetime import datetime

from app.forms import CreateSatelliteForm

from app.satellite_functions import calc_future_passes

@app.route('/view_satellites')
def view_satellites():    
    satellites = Satellite.query.all()

    return render_template('satellites.html', title='Satellites', satellites = satellites)

@app.route('/add_satellite', methods=['GET', 'POST'])
def add_satellite():    
    collections = SatelliteCollection.query.all()

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
    observer = Observer.query.filter_by(observer_default = 1).first()

    future_passes = None

    if observer == None:
        flash("No Default Observer Specified")
    else:
        future_passes = calc_future_passes(satellite.satellite_tle0, satellite.satellite_tle1, satellite.satellite_tle2, float(observer.observer_latitude), float(observer.observer_longitude), 10, 5)

    print(future_passes)
    
    return render_template('view_satellite.html', title='Satellite Name', satellite = satellite, future_passes = future_passes)


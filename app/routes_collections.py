from flask import render_template, flash, redirect, url_for, Response
from app import app, db
from app.models import Satellite, SatelliteCollection, SatelliteCollectionAssignmment
from app.forms import CreateCollectionForm, AddSatelliteCollectionForm
from sqlalchemy import and_
from skyfield.api import load, wgs84, EarthSatellite, Distance

from app.satellite_functions import get_satellite_record

@app.route('/collections')
def view_collections():    
    collections = SatelliteCollection.query.all()
    return render_template('collections.html', title='Collections', collections = collections)

@app.route('/get_tle_file/<collection_id>')
def get_tle_file(collection_id):    
    content = ""

    satellites = SatelliteCollectionAssignmment.query.filter_by(collection_id=collection_id).all()

    for sat in satellites:
        content += sat.Satellite.satellite_tle0 + "\n"
        content += sat.Satellite.satellite_tle1 + "\n"
        content += sat.Satellite.satellite_tle2 + "\n"

    return Response(content, mimetype='text/plain')

@app.route('/create_collection', methods=['GET', 'POST'])
def create_collection():    
    collections = SatelliteCollection.query.all()

    form = CreateCollectionForm()

    if form.validate_on_submit():
        checkExists = SatelliteCollection.query.filter_by(collection_name= form.collection_name.data).first()
        
        if checkExists != None:
            flash(form.collection_name.data + " already exists", 'warning')
        else:
            newCollection = SatelliteCollection(
                collection_name = form.collection_name.data,
            )

            db.session.add(newCollection)
            db.session.commit()

            return redirect(url_for('view_collections'))        
        

    return render_template('showbasicform.html', title='Create Collection',  form = form)

@app.route('/view_collection/<collection_id>', methods=['GET', 'POST'])
def view_collection(collection_id):    

    collection = SatelliteCollection.query.filter_by(collection_id=collection_id).first()

    if collection == None:
        flash("Unknown Collection")
        return redirect(url_for('view_collections'))        

    satellites = SatelliteCollectionAssignmment.query.filter_by(collection_id=collection_id).all()

    ts = load.timescale()

    satlist = []
    for satCollection in satellites:
        sat = satCollection.Satellite
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

        satlist.append(satObject)

    return render_template('view_collection.html', title=collection.collection_name + " Satellite Collection", collection_id=collection_id, satellites = satlist)

@app.route('/remove_satellite_collection/<collection_id>/<satellite_id>', methods=['GET', 'POST'])
def remove_satellite_collection(collection_id, satellite_id):

    assignment = SatelliteCollectionAssignmment.query.filter(and_(SatelliteCollectionAssignmment.collection_id==collection_id, SatelliteCollectionAssignmment.satellite_id==satellite_id)).first()

    if assignment == None:
        return redirect(url_for('view_collection', collection_id=collection_id))        

    db.session.delete(assignment)
    db.session.commit()
    flash("Satellite removed from collection")

    return redirect(url_for('view_collection', collection_id=collection_id))        
       

@app.route('/add_satellite_collection/<satellite_id>', methods=['GET', 'POST'])
def add_satellite_collection(satellite_id):

    satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()

    if satellite == None:
        flash("Satellite doesn't exist")
        return redirect(url_for('view_satellites'))        

    collections = SatelliteCollection.query.order_by(SatelliteCollection.collection_name.asc()).all()

    collectionList = []
    for collection in collections:
        collectionList.append( (collection.collection_id, collection.collection_name ))

    form = AddSatelliteCollectionForm()
    form.collection_name.choices = collectionList

    if form.validate_on_submit():
        checkExist = SatelliteCollectionAssignmment.query.filter(and_(SatelliteCollectionAssignmment.collection_id==form.collection_name.data, SatelliteCollectionAssignmment.satellite_id==satellite_id)).first()

        if checkExist == None:
            newAssignment = SatelliteCollectionAssignmment(
                collection_id = form.collection_name.data,
                satellite_id = satellite_id
            )

            db.session.add(newAssignment)
            db.session.commit()

            flash("Satellite added to collection")
            return redirect( url_for("view_satellites"))
        else:
            flash("Satellite already on this collection")

    return render_template('showbasicform.html', title='Add "' + satellite.satellite_name + '" Satellite to Collection', satellite=satellite, form=form)


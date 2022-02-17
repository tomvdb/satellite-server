from flask import render_template, flash, redirect, url_for
from app import app, db
from app.models import Observer
from datetime import datetime

from app.forms import AddObserverForm

@app.route('/view_observers')
def view_observers():    
    observers = Observer.query.all()
    return render_template('observers.html', title='Observers', observers=observers)

@app.route('/create_observer', methods=['GET', 'POST'])
def create_observer():    
    form = AddObserverForm()

    if form.validate_on_submit():
        checkExist = Observer.query.filter_by(observer_name=form.observer_name.data).first()

        if checkExist != None:
            flash(form.observer_name.data + " already exists")
        else:
            newObserver = Observer(
                observer_name = form.observer_name.data,
                observer_latitude = form.observer_latitude.data,
                observer_longitude = form.observer_longitude.data,
                observer_elevation = form.observer_elevation.data,
                observer_default = 0
            )

            db.session.add(newObserver)
            db.session.commit()

            return redirect(url_for('view_observers'))

    return render_template('showbasicform.html', title='Create Observer',  form = form)

@app.route('/make_observer_default/<observer_id>')
def make_observer_default(observer_id):    
    observer = Observer.query.filter_by(observer_id=observer_id).first()

    if observer == None:
        flash("Observer doesn't exist")
        
    else:
        sql = "update observer set observer_default=0"
        db.engine.execute(sql)
        observer.observer_default = 1
        db.session.add(observer)
        db.session.commit()

    return redirect(url_for('view_observers'))


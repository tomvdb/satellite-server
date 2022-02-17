from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField
from wtforms.validators import DataRequired

class CreateCollectionForm(FlaskForm):
    collection_name = StringField('Collection Name', validators=[DataRequired()])
    submit = SubmitField('Save')

class CreateSatelliteForm(FlaskForm):
    satellite_name = StringField('Satellite Name', validators=[DataRequired()])
    satellite_norad_id = StringField('Satellite Norad ID')
    satellite_tle0 = StringField('tle 0', validators=[DataRequired()])    
    satellite_tle1 = StringField('tle 1', validators=[DataRequired()])    
    satellite_tle2 = StringField('tle 2', validators=[DataRequired()])            
    submit = SubmitField('Save') 

class AddSatelliteCollectionForm(FlaskForm):
    collection_name = SelectField('Collection: ', validators=[DataRequired()], coerce=int)
    submit = SubmitField('Add to Collection') 

class AddObserverForm(FlaskForm):
    observer_name = StringField('Observer Name', validators=[DataRequired()])
    observer_latitude = StringField('Observer Latitude', validators=[DataRequired()])
    observer_longitude = StringField('Observer Longitude', validators=[DataRequired()])
    observer_elevation = StringField('Observer Elevation', validators=[DataRequired()])
    submit = SubmitField('Save') 
    
from app import app, db
from app.models import Satellite, SatelliteCollection, SatelliteCollectionAssignmment
from datetime import datetime, timedelta
import time
from math import degrees, pi, sqrt, acos, cos
import math
from skyfield.api import load, wgs84, EarthSatellite, Distance
from skyfield.positionlib import Geocentric
from skyfield.api import utc

def get_satellite_record(tle0, tle1, tle2):
    ts = load.timescale()
    satellite = EarthSatellite(tle1, tle2, tle0, ts)
    return satellite


def get_next_pass(tle0, tle1, tle2, latitude, longitude, horizon):
    print("next pass")
    ts = load.timescale()
    
    day = 1
    
    passes = calc_future_passes(tle0, tle1, tle2, latitude, longitude, horizon, day)

    while passes['passes_count'] == 0 and day < 5:
        passes = calc_future_passes(tle0, tle1, tle2, latitude, longitude, horizon, day)
        day += 1

    if passes['passes_count'] == 0:
        return None

    satrise = passes['passes'][0]['satellite_rise']
    satset = passes['passes'][0]['satellite_set']
    startaz = passes['passes'][0]['azimuth']
    maxel = passes['passes'][0]['cumulation_elevation']
    satmax = passes['passes'][0]['satellite_cumulation']

    current = satrise

    print(passes['passes'][0])

    next_pass = {

        #'satrise' : time.mktime(satrise.timetuple()),
        #'satset' :time.mktime(satset.timetuple()),
        #'satmax' : time.mktime(satmax.timetuple()),
        'satrise' : satrise,
        'satset' : satset,
        'satmax' : satmax,
        'startaz' : startaz,
        'maxel' : maxel,
        'passdata' : []
    }

    while ( current < satset ):
        current = current + timedelta(seconds=10)
        data = calc_current_pos_time(ts.utc(current), tle0, tle1, tle2, latitude, longitude, horizon)

        next_pass['passdata'].append({
            'latitude' : data['current_latitude'],
            'longitude' : data['current_longitude'],
            'azimuth' : data['current_azimuth'],
            'elevation' : data['current_elevation']
        })

    print(next_pass)

    return next_pass


def get_orbit(tle0, tle1, tle2, latitude, longitude, horizon):
    ts = load.timescale()
    
    current = datetime.utcnow()
    current = current.replace(tzinfo=utc) 

    orbit = {
        'passdata' : []
    }

    end = current + timedelta(hours=2)

    while ( current < end ):
        current = current + timedelta(minutes=2)
        data = calc_current_pos_time(ts.utc(current), tle0, tle1, tle2, latitude, longitude, horizon)
        print(current)

        print(data['current_latitude'])
        print(data['current_longitude'])
        print(data['current_azimuth'])
        print(data['current_elevation'])

        orbit['passdata'].append({
            'timestamp' : current,
            'latitude' : data['current_latitude'],
            'longitude' : data['current_longitude'],
        })

    #print(orbit)

    return orbit



def calc_future_passes(tle0, tle1, tle2, latitude, longitude, horizon):
    return calc_future_passes(tle0, tle1, tle2, latitude, longitude, horizon, 3)


def calc_future_passes(tle0, tle1, tle2, latitude, longitude, horizon, days):

    ts = load.timescale()
    satellite = EarthSatellite(tle1, tle2, tle0, ts)

    station = wgs84.latlon(latitude, longitude)

    t0 = ts.now()
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=days))
    t, events = satellite.find_events(station, t0, t1, altitude_degrees=horizon)

    futurePasses = { 'epoch' : satellite.epoch.utc_datetime(), 'passes_count' : 0, 'passes' : [] }

    satellite_pass = None
    for ti, event in zip(t, events):
        difference = satellite - station
        topocentric = difference.at(ti)
        alt, az, distance = topocentric.altaz()

        if event == 0 and satellite_pass == None:
            satellite_pass = { 'azimuth' : az.degrees, 'satellite_rise' : ti.utc_datetime(), 'satellite_cumulation' : ti.utc_datetime(), 'satellite_set' : ti.utc_datetime(), 'cumulation_elevation' : 0}

        if event == 1 and satellite_pass != None:
            satellite_pass['cumulation_elevation'] = alt.degrees
            satellite_pass['satellite_cumulation'] = ti.utc_datetime()

        if event == 2 and satellite_pass != None:
            satellite_pass['satellite_set'] = ti.utc_datetime()
            futurePasses['passes'].append(satellite_pass)
            satellite_pass = None

        futurePasses['passes_count'] = len(futurePasses['passes'])

    return futurePasses

def calc_current_pos_time(curTimeStamp, tle0, tle1, tle2, latitude, longitude, horizon):

    ts = load.timescale()
    satellite = EarthSatellite(tle1, tle2, tle0, ts)
    station = wgs84.latlon(latitude, longitude)
   
    curDifferece = satellite - station
    topocentric = curDifferece.at(curTimeStamp)
    alt, az, distance = topocentric.altaz()

    geocentric = satellite.at(curTimeStamp)
    #print(geocentric)
    lat, lon = wgs84.latlon_of(geocentric)
 
    height = wgs84.height_of(geocentric)

    # experimental
    footprint = 12756.33 * acos(6378.135  / (6378.135  + height.km))

    currentPosition = {
        'title' : tle0,
        'tle1' : tle1,
        'tle2' : tle2,
        'timestamp' : curTimeStamp.utc_datetime(), 
        'current_azimuth'  : "{:.2f}".format(az.degrees), 
        'current_elevation' : "{:.2f}".format(alt.degrees),
        'current_latitude' : lat.degrees,
        'current_longitude' : lon.degrees,
        'current_height' : height.km,
        'current_footprint' : footprint
    }

    return currentPosition

def calc_current_pos(tle0, tle1, tle2, latitude, longitude, horizon):

    ts = load.timescale()
    satellite = EarthSatellite(tle1, tle2, tle0, ts)
    station = wgs84.latlon(latitude, longitude)
   
    curTimeStamp = ts.now()

    curDifferece = satellite - station
    topocentric = curDifferece.at(curTimeStamp)
    alt, az, distance = topocentric.altaz()

    geocentric = satellite.at(curTimeStamp)
    print(geocentric)
    lat, lon = wgs84.latlon_of(geocentric)
 
    height = wgs84.height_of(geocentric)

    # experimental
    footprint = 12756.33 * acos(6378.135  / (6378.135  + height.km))

    currentPosition = {
        'title' : tle0,
        'tle1' : tle1,
        'tle2' : tle2,
        'timestamp' : curTimeStamp.utc_datetime(), 
        'current_azimuth'  : "{:.2f}".format(az.degrees), 
        'current_elevation' : "{:.2f}".format(alt.degrees),
        'current_latitude' : lat.degrees,
        'current_longitude' : lon.degrees,
        'current_height' : height.km,
        'current_footprint' : footprint
    }

    return currentPosition

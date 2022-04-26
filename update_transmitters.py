from app.models import SatelliteTransmitter
from app import db
import requests
from datetime import datetime


url = "https://db.satnogs.org/api/transmitters/?alive=true&format=json"

transmitters = requests.get(url)


if transmitters.status_code == 200:

    # easier to just refresh table
    SatelliteTransmitter.query.delete()
    db.session.commit()

    data = transmitters.json()

    for transmitter in data:
        if transmitter['norad_cat_id'] == None:
            continue

        newTransmitter = SatelliteTransmitter(
            satellite_norad_id = transmitter['norad_cat_id'],
            transmitter_description = transmitter['description'],
            transmitter_alive = transmitter['alive'],
            transmitter_type = transmitter['type'],
            transmitter_uplink_low = transmitter['uplink_low'],
            transmitter_uplink_high = transmitter['uplink_high'],
            transmitter_uplink_mode = transmitter['uplink_mode'],
            transmitter_downlink_low = transmitter['downlink_low'],
            transmitter_downlink_high = transmitter['downlink_high'],
            transmitter_downlink_mode = transmitter['mode'],
            transmitter_invert = transmitter['invert'],
            transmitter_baud = transmitter['baud'],
            transmitter_citation = transmitter['citation'],
            transmitter_coordination = transmitter['coordination'],
            transmitter_coordination_url = transmitter['coordination_url'],
        )

        db.session.add(newTransmitter)
        db.session.commit()

'''
for sat in satellites:
    norad_id = sat.satellite_norad_id

    if len(str(norad_id)) > 0:
        req = requests.get(url + str(norad_id))

        if req.status_code == 200:
            data = req.json()
            if len(data) > 0:
                data = data[0]

                print(data)

                sat.satellite_tle0 = data['tle0']
                sat.satellite_tle1 = data['tle1']
                sat.satellite_tle2 = data['tle2']
                tle_updated = datetime.now()

                db.session.add(sat)
                db.session.commit()
'''
        

    

    
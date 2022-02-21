from app.models import Satellite
from app import db
import requests
from datetime import datetime

satellites = Satellite.query.all()

url = "https://db.satnogs.org/api/tle/?format=json&norad_cat_id="

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
        

    

    
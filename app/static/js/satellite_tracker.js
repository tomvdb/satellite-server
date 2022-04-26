
// satellite properties
var selectedSatellite = null;

// list satellites
var satellites = []

var observerGd = {
  longitude: 0,
  latitude: 0,
  height: 0.370
};

// misc tmp variables
var once = 0;


var bounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
var mymap = L.map('map', { center: bounds.getCenter(), maxBounds: bounds, maxBoundsViscosity: 1.0, minZoom: 2, }).setView([0, 0], 2);
var layerGroup = L.layerGroup().addTo(mymap);
var satGroup = L.layerGroup().addTo(mymap);
var observer = L.marker([0, 0], { icon: qth, title: 'Observer' }).addTo(mymap);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c']
}).addTo(mymap);

var table = document.getElementById("satellitelist");

// search for satellite object in satellite list via title
function getSatelliteByTitle(arr, value) {
  for (var i = 0, iLen = arr.length; i < iLen; i++) {
    if (arr[i].title == value) return arr[i];
  }
  return null
}


// calculate satellite positions based on date object
function calcSatellitePositions(satrec, dateobject) {
  var gmst = satellite.gstime(dateobject);
  var positionAndVelocity = satellite.propagate(satrec, dateobject);

  var positionEci = positionAndVelocity.position;
  var velocityEci = positionAndVelocity.velocity;
  var positionGd = satellite.eciToGeodetic(positionEci, gmst);
  var positionEcf = satellite.eciToEcf(positionEci, gmst);
  var lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
  var positionEcf = satellite.eciToEcf(positionEci, gmst);
  //var velocityEcf = satellite.eciToEcf(velocityEci, gmst); 
  var observerEcf = satellite.geodeticToEcf(observerGd);
  var observerEci = satellite.ecfToEci(observerEcf, gmst);

  var dopplerFactorEci = satellite.dopplerFactor(observerEci, positionEci, velocityEci);

  return [positionGd, lookAngles, dopplerFactorEci]
}

function calcNextPass(satrec) {

  if (isGeostationary(satrec)) {
    return { 'aos': null, 'los': null, 'maxel_dt': null, 'max_el': 0, 'start_az': 0, 'path': [] }
  }

  var start = new dayjs(new Date())
  var end = start.add(2, 'd')

  console.log(start)
  console.log(end)
  var prevLat = 0;
  var prevLon = 0;

  var aos_dt = null
  var los_dt = null
  var maxel_dt = null
  var max_el = -1
  var start_az = -1
  var prev_el = -1

  var path = []

  for (var t = start; t < end; t = t.add(20, 's')) {
    var position = calcSatellitePositions(satrec, t.toDate())

    //console.log(position)
    var elevation = satellite.radiansToDegrees(position[1].elevation)
    var azimuth = satellite.radiansToDegrees(position[1].azimuth)

    //console.log(elevation)

    if (elevation > 0) {
      // pass started
      if (prev_el < 0) {
        console.log("sat rise")
        max_el = elevation
        start_az = azimuth
        aos_dt = t
      }

      // determine highest point
      if (elevation > max_el) {
        max_el = elevation
        maxel_dt = t
      }

      newLat = satellite.radiansToDegrees(position[0].latitude);
      newLon = satellite.radiansToDegrees(position[0].longitude)

      path.push([newLat, newLon])
    }
    else {
      // have we reached end of the pass
      if (prev_el > 0) {
        los_dt = t;
        break;
      }
    }

    prev_el = elevation;
  }

  return { 'aos': aos_dt, 'los': los_dt, 'maxel_dt': maxel_dt, 'max_el': max_el, 'start_az': start_az, 'path': path }
}

// update satellite data from server (called when next pass is over)
function updateData(jsondata) {
  console.log(jsondata);
  layerGroup.clearLayers();

  // update satellites
  jsondata.satellites.forEach(element => {
    for (var i = 0, iLen = satellites.length; i < iLen; i++) {
      if (satellites[i].title == element.title) {
        var satrec = satellite.twoline2satrec(element.tle1, element.tle2);
        satellites[i].next_pass_data = calcNextPass(satrec)
        break;
      }
    }
  })
};

/*
Arccosine implementation. 

Returns a value between zero and two pi.
Borrowed from gsat 0.9 by Xavier Crehueras, EB3CZS.
Optimized by Alexandru Csete.
*/
function arccos(x, y) {
  if (x && y) {
    if (y > 0.0)
      return Math.acos(x / y);
    else if (y < 0.0)
      return pi + Math.acos(x / y);
  }

  return 0.0;
}

/* 
Range circle calculations.

Borrowed from gsat 0.9.0 by Xavier Crehueras, EB3CZS
who borrowed from John Magliacane, KD2BD.
Optimized by Alexandru Csete and William J Beksi.
*/
function generateFootprint(satrec) {
  pos = calcSatellitePositions(satrec, new Date())

  var xkmper = 6.378135e3;
  var pi = 3.1415926535898; /* Pi */
  var pio2 = 1.5707963267949; /* Pi/2 */

  // not sure if this is 100% correct, but it looks right
  var footprint = 12756.33 * Math.acos(xkmper / (xkmper + pos[0].height))

  var beta = (0.5 * footprint) / xkmper;
  var ssplat = pos[0].latitude
  var ssplon = pos[0].longitude

  var points = [];

  var lat = 0;
  var lon = 0;

  for (azi = 0; azi < 360; azi += 1) {
    azimuth = satellite.degreesToRadians(azi);
    lat = Math.asin(Math.sin(ssplat) * Math.cos(beta) + Math.cos(azimuth) * Math.sin(beta)
      * Math.cos(ssplat));
    num = Math.cos(beta) - (Math.sin(ssplat) * Math.sin(lat));
    dem = Math.cos(ssplat) * Math.cos(lat);

    if (azi == 0 && (beta > pio2 - ssplat))
      lon = ssplon + pi;

    else if (azi == 180 && (beta > pio2 + ssplat))
      lon = ssplon + pi;

    else if (Math.abs(num / dem) > 1.0)
      lon = ssplon;

    else {
      if ((180 - azi) >= 0)
        lon = ssplon - arccos(num, dem);
      else
        lon = ssplon + arccos(num, dem);
    }

    points.push([satellite.radiansToDegrees(lat), satellite.radiansToDegrees(lon)]);
  }


  return points;
}

function dopplerDiff(dopplerFactor, frequency) {
  dop100mhz = Math.round(100 * dopplerFactor * 1000000)
  dop = dop100mhz - 100000000
  return dop
}

function updateSelectedSatellite() {
  if (selectedSatellite == null)
    return



  layerGroup.clearLayers();

  satelliteData = selectedSatellite;

  var satdata = calcSatellitePositions(satelliteData.satrec, new Date())

  var positionGd = satdata[0]
  var lookAngles = satdata[1]
  var dopplerFactor = satdata[2]


  // satellite properties
  prop_title.innerHTML = satelliteData.title
  prop_tracker_title.innerHTML = prop_title.innerHTML

  prop_az.innerHTML = satellite.radiansToDegrees(lookAngles.azimuth).toFixed(2)
  prop_el.innerHTML = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2)

  prop_tracker_az.innerHTML = prop_az.innerHTML
  prop_tracker_el.innerHTML = prop_el.innerHTML


  if (satelliteData.prevRange == null) {
    prop_range.innerHTML = lookAngles.rangeSat.toFixed(0) + " (?)"
  }
  else {
    if (satelliteData.prevRange > lookAngles.rangeSat) {
      prop_range.innerHTML = lookAngles.rangeSat.toFixed(0) + " (-)"
      //
    }
    else {
      prop_range.innerHTML = lookAngles.rangeSat.toFixed(0) + " (+)"
      //prop_tracker_dopup.innerHTML = (-1 * dop) + "Hz"
    }
  }

  prop_tracker_range.innerHTML = prop_range.innerHTML

  selectedSatellite.prevRange = lookAngles.rangeSat

  // draw footprint
  footprintpoints = generateFootprint(satelliteData.satrec);
  var footprint = L.polygon(footprintpoints);
  footprint.addTo(layerGroup);

  if (isGeostationary(satelliteData.satrec) == false) {
    var satrise = satelliteData.next_pass_data.aos;

    var difference = satrise.toDate().getTime() - (new Date().getTime())

    var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 0 && minutes >= 0) {
      prop_countdown.innerHTML = hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
    }
    else {
      prop_countdown.innerHTML = '<span class="badge bg-success">Now</span>';
    }


    // draw next pass
    var polyline = L.polyline(satelliteData.next_pass_data.path).arrowheads({ size: '20px', frequency: 'endonly' });
    polyline.addTo(layerGroup);

    // draw orbit
    orbit = []
    var start = new dayjs(new Date())
    var end = satelliteData.next_pass_data.aos

    var prevLat = 0;
    var prevLon = 0;

    for (var t = start; t < end; t = t.add(20, 's')) {
      var position = calcSatellitePositions(satelliteData.satrec, t.toDate())

      newLat = satellite.radiansToDegrees(position[0].latitude);
      newLon = satellite.radiansToDegrees(position[0].longitude)

      if (Math.abs(newLat - prevLat) > 10) {
        var polyline = L.polyline(orbit, { color: 'black' });
        polyline.addTo(layerGroup);
        orbit = []
      }

      if (Math.abs(newLon - prevLon) > 10) {
        var polyline = L.polyline(orbit, { color: 'black' });
        polyline.addTo(layerGroup);
        orbit = []
      }

      orbit.push([newLat, newLon])

      prevLat = satellite.radiansToDegrees(position[0].latitude)
      prevLon = satellite.radiansToDegrees(position[0].longitude)
    }
    var polyline = L.polyline(orbit, { color: 'black' });
    polyline.addTo(layerGroup);
  }
  else {
    prop_countdown.innerHTML = "N/A"
  }

  prop_tracker_countdown.innerHTML = prop_countdown.innerHTML

  // draw polar graph
  var tleLine1 = satelliteData.tle1
  var tleLine2 = satelliteData.tle2

  var timeframe = {
    start: new dayjs(new Date(satelliteData.next_pass_data.aos)),
    end: new dayjs(new Date(satelliteData.next_pass_data.los))
  };


  var groundstation = {
    lon: observerGd.longitude,
    lat: observerGd.latitude,
    alt: 0
  };


  // send rotator position
  if ($("#rotatorEnabled").is(':checked')) {

    var az = satellite.radiansToDegrees(lookAngles.azimuth).toFixed(2)
    var el = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2)

    // only send if elevation > 0
    // TODO: improve this to handle with 0 - 180 elevation rotator (ie. flip)
    if (el > 0) {
      rot_requested_az.innerHTML = az;
      rot_requested_el.innerHTML = el;

      if (rotatorConnected) {
        var rotatorData = { 'az': satellite.radiansToDegrees(lookAngles.azimuth), 'el': satellite.radiansToDegrees(lookAngles.elevation) }
        sendWS(rotatorData);
      }
    }
    else {
      rot_requested_az.innerHTML = satelliteData.next_pass_data.start_az.toFixed(2)
      rot_requested_el.innerHTML = 0;

      if (rotatorConnected) {
        var rotatorData = { 'az': satelliteData.next_pass_data.start_az, 'el': 0 }
        sendWS(rotatorData);
      }

    }
  }

  // update radio data
  var e = document.getElementById("sel_transmitter");

  if (e != null) {
    var value = e.options[e.selectedIndex].value;
    var text = e.options[e.selectedIndex].text;

    transmitter = satelliteData.transmitters[value]

    dop = dopplerDiff(dopplerFactor, 100)


    if (transmitter.downlink_low != null) {
      downlink = transmitter.downlink_low.toString()
      downlink = downlink.padStart(9, '0')
      downlink = downlink.substring(0, 3) + "." + downlink.substring(3, 6) + "." + downlink.substring(6) + " Hz"
      downlink_freq_sat.innerHTML = downlink
      downlink_mode.innerHTML = transmitter.downlink_mode

      dop = dopplerDiff(dopplerFactor, 100)
      //prop_tracker_dopup.innerHTML = dop + "Hz"

      doppler_amount = (dop / 100) * (transmitter.downlink_low / 1000000)     

      if (satelliteData.prevRange > lookAngles.rangeSat) 
      {}
      else
      {
        doppler_amount = doppler_amount * -1;
      }
      
      downlink_doppler.innerHTML = Math.round(doppler_amount) + " Hz"

      downlink_doppler_amount = (transmitter.downlink_low + Math.round(doppler_amount)).toString()
      downlink_doppler_amount = downlink_doppler_amount.padStart(9, '0')
      downlink_doppler_amount = downlink_doppler_amount.substring(0, 3) + "." + downlink_doppler_amount.substring(3, 6) + "." + downlink_doppler_amount.substring(6) + " Hz"
      downlink_freq_radio.innerHTML = downlink_doppler_amount
    }
    else
    {
      downlink_mode.innerHTML = "N/A"
      downlink_freq_sat.innerHTML = "N/A"      
      downlink_freq_radio.innerHTML = "N/A"      
      downlink_doppler.innerHTML = "N/A"
    }

    if (transmitter.uplink_low != null) {
      uplink = transmitter.uplink_low.toString()
      uplink = uplink.padStart(9, '0')
      uplink = uplink.substring(0, 3) + "." + uplink.substring(3, 6) + "." + uplink.substring(6) + " Hz"
      uplink_freq_sat.innerHTML = uplink
      uplink_mode.innerHTML = transmitter.uplink_mode

      doppler_amount = (dop / 100) * (transmitter.uplink_low / 1000000)     

      if (satelliteData.prevRange > lookAngles.rangeSat) 
      {
        doppler_amount = doppler_amount * -1;
      }
      else
      {
      }

      uplink_doppler.innerHTML = Math.round(doppler_amount) + " Hz"

      uplink_doppler_amount = (transmitter.uplink_low + Math.round(doppler_amount)).toString()
      uplink_doppler_amount = uplink_doppler_amount.padStart(9, '0')
      uplink_doppler_amount = uplink_doppler_amount.substring(0, 3) + "." + uplink_doppler_amount.substring(3, 6) + "." + uplink_doppler_amount.substring(6) + " Hz"
      uplink_freq_radio.innerHTML = uplink_doppler_amount
    }
    else
    {
      uplink_mode.innerHTML = "N/A"
      uplink_freq_sat.innerHTML = "N/A"      
      uplink_freq_radio.innerHTML = "N/A"      
      uplink_doppler.innerHTML = "N/A"

    }

  }


  // update polar graph
  var polarPlotSVG = calcPolarPlotSVG(timeframe,
    groundstation,
    tleLine1,
    tleLine2, isGeostationary(satelliteData.satrec), { 'az': azActual, 'el': elActual });

  var based = '<path fill="none" stroke="black" stroke-width="1" d="M 0 -90 v 180 M -90 0 h 180"></path> \
          <circle fill="none" stroke="black" cx="0" cy="0" r="30"></circle> \
          <circle fill="none" stroke="black" cx="0" cy="0" r="60"></circle> \
          <circle fill="none" stroke="black" cx="0" cy="0" r="90"></circle> \
          <text x="-3" y="-96" class="small"> \
            0° \
          </text> \
          <text x="-8" y="105" class="small"> \
            180° \
          </text> \
          <text x="96" y="4" class="small"> \
            90° \
          </text> \
          <text x="-112" y="4" class="small"> \
           270° \
          </text> \
      '


  $('svg#polar').html(based);
  $('svg#polar').append(polarPlotSVG);
  //$('svg#polar_tracker').html(based);
  //$('svg#polar_tracker').append(polarPlotSVG);
  polar_tracker.innerHTML = polar.innerHTML

}

function selectSatellite(marker) {
  console.log(marker.properties.title)
  satelliteData = getSatelliteByTitle(satellites, marker.properties.title);

  if (marker.options.icon.options.iconUrl.search("satellite_active") == -1) {
    marker.setIcon(inRangeIcon)
  }

  if (satelliteData == null) {
    console.log("error: can't find satellite object")
  }
  else {
    selectedSatellite = satelliteData

    // update transmitters list
    if (selectedSatellite.transmitters.length > 0) {
      // build up a selection 
      transmitter_data = "<select name='sel_transmitter' id='sel_transmitter'>";
      for (let x = 0; x < selectedSatellite.transmitters.length; x++) {
        transmitter_data = transmitter_data + "<option value=" + x + ">" + selectedSatellite.transmitters[x].description + "</option>"
      }
      transmitter_data += "</select>";
      prop_tracker_transmitters.innerHTML = transmitter_data;
    }
    else {
      prop_tracker_transmitters.innerHTML = "<b>None Specified</b>";
    }

    updateSelectedSatellite();
  }
}

function isGeostationary(satrec) {

  if (satrec.no < 0.005)
    return true;
  else
    return false;
}

function initMap(jsondata) {
  console.log(jsondata);

  // clear data
  satellites = []
  layerGroup.clearLayers();
  satGroup.clearLayers();
  table.innerHTML = ""

  observer_lat = jsondata.observer.coordinates[0];
  observer_lon = jsondata.observer.coordinates[1];

  observerGd.latitude = satellite.degreesToRadians(observer_lat)
  observerGd.longitude = satellite.degreesToRadians(observer_lon)

  observer.setLatLng([observer_lat, observer_lon]).update();

  var first = 0;

  // update satellites
  jsondata.satellites.forEach(element => {

    // does our satellite exist in list ?
    satelliteData = getSatelliteByTitle(satellites, element.title);

    if (satelliteData == null) {
      // create a new one

      var marker = L.marker([0, 0], { 'title': element.title, icon: outRangeIcon })

      marker.bindTooltip(element.title,
        {
          permanent: true,
          direction: 'right'
        });

      marker.properties = {}
      marker.properties.title = element.title

      marker.on('click', function (ev) {
        console.log("clicked")
        selectSatellite(ev.target)
      });


      var addedMarker = marker.addTo(satGroup)

      satObject = { 'dbid': element.dbid, 'title': element.title, 'marker': addedMarker, 'tle1': element.tle1, 'tle2': element.tle2 }

      var satrec = satellite.twoline2satrec(element.tle1, element.tle2);

      //console.log(element.title)
      //console.log("Geostationary Check");
      //console.log(satrec.no)
      //console.log(isGeostationary(satrec));

      var satdata = calcSatellitePositions(satrec, new Date())

      var positionGd = satdata[0]
      var lookAngles = satdata[1]

      var lat = satellite.radiansToDegrees(positionGd.latitude);
      var lon = satellite.radiansToDegrees(positionGd.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        return;
      }

      satObject.marker.setLatLng([lat, lon]).update()
      satObject.satrec = satrec

      satObject.next_pass_data = calcNextPass(satrec)
      satObject.transmitters = element.transmitters
      var newRow = table.insertRow();
      var satname = newRow.insertCell();
      var sataz = newRow.insertCell();
      var satel = newRow.insertCell();
      var satrange = newRow.insertCell();
      var countdown = newRow.insertCell();
      var nextpassaos = newRow.insertCell();
      var nextpassmax = newRow.insertCell();
      var nextpasslos = newRow.insertCell();
      var maxel = newRow.insertCell();
      var info = newRow.insertCell();

      satname.innerHTML = element.title
      sataz.innerHTML = satellite.radiansToDegrees(lookAngles.azimuth).toFixed(2)
      satel.innerHTML = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2)
      satrange.innerHTML = lookAngles.rangeSat.toFixed(0)

      if (isGeostationary(satrec) == false) {
        var satrise = satdata.aos
        var satset = satdata.los
        var satmax = satdata.maxel_dt

        if (satrise != null) nextpassaos.innerHTML = satrise.utc().format('YYYY/MM/DD HH:mm')
        if (satmax != null) nextpassmax.innerHTML = satmax.utc().format('YYYY/MM/DD HH:mm')
        if (satset != null) nextpasslos.innerHTML = satset.utc().format('YYYY/MM/DD HH:mm')

        maxel.innerHTML = satdata.max_el

        if (satrise != null) {
          var difference = satrise.toDate().getTime() - (new Date().getTime())

          var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

          if (hours >= 0 && minutes >= 0) {
            countdown.innerHTML = hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
          }
          else {
            countdown.innerHTML = '<span class="badge bg-success">Now</span>';
          }
        }
      }
      else {
        nextpassaos.innerHTML = "N/A"
        nextpassmax.innerHTML = "N/A"
        nextpasslos.innerHTML = "N/A"
        countdown.innerHTML = "N/A"
        maxel.innerHTML = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2)
      }

      info.innerHTML = "<a href='/view_satellite/" + element.dbid + "'><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-search' viewBox='0 0 16 16'><path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/></svg></a>"
      satObject.row = newRow
      satellites.push(satObject)



      if (first == 0) {
        selectSatellite(satObject.marker);
        first = 1;
      }
    }
  });

  updateLoop();
}

function updateLoop() {

  sortTable(5, table);

  count = 1;
  needUpdate = 0;

  satellites.forEach(element => {
    var satdata = calcSatellitePositions(element.satrec, new Date())

    positionGd = satdata[0]
    lookAngles = satdata[1]

    var lat = satellite.radiansToDegrees(positionGd.latitude);
    var lon = satellite.radiansToDegrees(positionGd.longitude);

    element.marker.setLatLng([lat, lon]).update()


    if (selectedSatellite.title != element.title) {
      if (element.marker.options.icon.options.iconUrl.search("satellite_inactive") == -1) {
        element.marker.setIcon(outRangeIcon)
      }
    }

    for (var x = 0; x < table.rows.length; x++) {
      if (htmlDecode(table.rows[x].cells[0].innerHTML) == element.title) {

        if (satellite.radiansToDegrees(lookAngles.elevation) > 0) {
          table.rows[x].cells[0].style.backgroundColor = "green";
        }
        else {
          table.rows[x].cells[0].style.backgroundColor = 'grey';
        }

        table.rows[x].cells[1].innerHTML = satellite.radiansToDegrees(lookAngles.azimuth).toFixed(2)
        table.rows[x].cells[2].innerHTML = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2)
        table.rows[x].cells[3].innerHTML = lookAngles.rangeSat.toFixed(2)

        if (isGeostationary(element.satrec) == false) {
          var satrise = element.next_pass_data.aos
          var satset = element.next_pass_data.los
          var satmax = element.next_pass_data.maxel_dt

          if (satset != null) {
            if (satset < new dayjs()) {
              console.log("need update")
              needUpdate = 1;
            }
          }

          if (satrise != null && satset != null && satmax != null) {
            var difference = satrise.toDate().getTime() - (new Date().getTime())
            var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));


            if (hours >= 0 && minutes >= 0) {
              table.rows[x].cells[4].innerHTML = hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
            }
            else {
              table.rows[x].cells[4].innerHTML = '<span class="badge bg-success">Now</span>';
            }

            table.rows[x].cells[5].innerHTML = satrise.utc().format('YYYY/MM/DD HH:mm')
            table.rows[x].cells[6].innerHTML = satmax.utc().format('YYYY/MM/DD HH:mm')
            table.rows[x].cells[7].innerHTML = satset.utc().format('YYYY/MM/DD HH:mm')
          }

          table.rows[x].cells[8].innerHTML = element.next_pass_data.max_el.toFixed(2)
        }
        else {
          table.rows[x].cells[8].innerHTML = satellite.radiansToDegrees(lookAngles.elevation).toFixed(2)
        }
      }
    }

    count += 1
  });

  if (needUpdate == 1) {
    updateSatelliteList();
  }

  // update selected satellite properties
  updateSelectedSatellite()

  setTimeout(updateLoop, 1000);
}

function getSatelliteList() {
  var e = document.getElementById("collections");
  var value = e.options[e.selectedIndex].value;
  var text = e.options[e.selectedIndex].text;

  console.log(value)
  console.log(text)

  $.ajax({
    url: "/browser/satellite_data/" + value,
    type: 'GET',
    dataType: 'json',
    success: function (res) {
      initMap(res)
    }
  }).then(function () {
    //setTimeout(update, 1000); 
  });
}

function updateSatelliteList() {
  console.log("Update Satellite Data")
  $.ajax({
    url: "/browser/satellite_data/1",
    type: 'GET',
    dataType: 'json',
    success: function (res) {
      updateData(res)
    }
  }).then(function () {
    //setTimeout(update, 1000); 
  });

}

var tabEl = document.querySelector('button[data-bs-toggle="tab"]')
tabEl.addEventListener('shown.bs.tab', function (event) {
  mymap.invalidateSize();
})

$(document).ready(function () {
  getSatelliteList();

  connectRotator();
  connectRadio();

});


function calcPolarPlotSVG(timeframe, groundstation, tleLine1, tleLine2, geo, rotatorValues) {
    'use strict';

    const pi = Math.PI;
    const deg2rad = pi / 180.0;
    const rad2deg = 180 / pi;

    // Get the observer at lat/lon in RADIANS, altitude in km above ground (NOTE: BUG, should be elevation?)
    var observerGd = {
        longitude: groundstation.lon,
        latitude: groundstation.lat,
        height: 0
    };

    var polarGetXY = function (az, el) {
        var ret = new Object();
        ret.x = (90 - el) * Math.sin(az * deg2rad);
        ret.y = (el - 90) * Math.cos(az * deg2rad);
        return ret;
    };

    var svg_namespace = 'http://www.w3.org/2000/svg';
    var polarOrbit = document.createElementNS(svg_namespace, 'path');
    polarOrbit.setAttributeNS(null, 'fill', 'none');
    polarOrbit.setAttributeNS(null, 'stroke', 'blue');
    polarOrbit.setAttributeNS(null, 'stroke-opacity', '1.0');
    polarOrbit.setAttributeNS(null, 'stroke-width', '1');

    // Initialize the satellite record
    var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

    function polarGetAzEl(t) {

        var positionAndVelocity = satellite.propagate(satrec, t.toDate());

        var gmst = satellite.gstime(t.toDate());
        var positionEci = positionAndVelocity.position;
        var positionEcf = satellite.eciToEcf(positionEci, gmst);

        var lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

        return {
            'azimuth': lookAngles.azimuth * rad2deg,
            'elevation': lookAngles.elevation * rad2deg
        };
    }

    if (geo == false) {
        // Draw the orbit pass on the polar az/el plot
        var g = '';

        for (var t = timeframe.start; t < timeframe.end; t = t.add(20, 's')) {
            var sky_position = polarGetAzEl(t);
            var coord = polarGetXY(sky_position.azimuth, sky_position.elevation);

            if (g == '') {
                g += 'M';
            } else {
                g += ' L';
            }
            g += coord.x + ' ' + coord.y;
        }

        polarOrbit.setAttribute('d', g);

        // Draw observation start
        var point_start = document.createElementNS(svg_namespace, 'circle');
        point_start.setAttributeNS(null, 'fill', 'blue');
        point_start.setAttributeNS(null, 'stroke', 'black');
        point_start.setAttributeNS(null, 'stroke-width', '1');

        var sky_position_rise = polarGetAzEl(timeframe.start);
        var coord_rise = polarGetXY(sky_position_rise.azimuth, sky_position_rise.elevation);

        point_start.setAttribute('cx', coord_rise.x);
        point_start.setAttribute('cy', coord_rise.y);
        point_start.setAttribute('r', 2);
    
        // Draw oberservation end
        var point_end = document.createElementNS(svg_namespace, 'circle');
        point_end.setAttributeNS(null, 'fill', 'blue');
        point_end.setAttributeNS(null, 'stroke', 'black');
        point_end.setAttributeNS(null, 'stroke-width', '1');
    
        var sky_position_set = polarGetAzEl(timeframe.end);
        var coord_set = polarGetXY(sky_position_set.azimuth, sky_position_set.elevation);
    
        point_end.setAttribute('cx', coord_set.x);
        point_end.setAttribute('cy', coord_set.y);
        point_end.setAttribute('r', 2);
    
    }

    // draw rotator
    if (rotatorValues.az >= 0 && rotatorValues.el >= 0)
    {

        var point_rotator = document.createElementNS(svg_namespace, 'circle');
        var coord_rotator = polarGetXY(rotatorValues.az, rotatorValues.el);
        point_rotator.setAttribute('cx', coord_rotator.x);
        point_rotator.setAttribute('cy', coord_rotator.y);
        point_rotator.setAttribute('r', 9);
        //point_end.setAttributeNS(null, 'fill', 'blue');
        point_rotator.setAttributeNS(null, 'stroke', 'purple');
        point_rotator.setAttributeNS(null, 'stroke-width', '1');
        point_rotator.setAttributeNS(null, 'fill-opacity', '0.1');

        /*
        var point_crosshair = document.createElementNS(svg_namespace, 'path');
        point_crosshair.setAttributeNS(null, 'stroke', 1)
        point_crosshair.setAttributeNS(null, 'stroke-width', 1)
        var pathdata = "M" + coord_rotator.x + " " + coord_rotator.y + " L" + (coord_rotator.x + 10) + " " + coord_rotator.y
        console.log(pathdata)
        point_crosshair.setAttribute('d', "M" + coord_rotator.x + " " + coord_rotator.y + " L" + (coord_rotator.x + 10) + " " + coord_rotator.y)
        */

    }


    // sat visible now ?
    var sky_position_current = polarGetAzEl(new dayjs(new Date()));
    if (sky_position_current.elevation > 0) {
        var point_current = document.createElementNS(svg_namespace, 'circle');
        point_current.setAttributeNS(null, 'fill', 'green');
        point_current.setAttributeNS(null, 'stroke', 'black');
        point_current.setAttributeNS(null, 'stroke-width', '1');

        var coord_set = polarGetXY(sky_position_current.azimuth, sky_position_current.elevation);

        point_current.setAttribute('cx', coord_set.x);
        point_current.setAttribute('cy', coord_set.y);
        point_current.setAttribute('r', 7);
    }

    var drawObjects = [polarOrbit, point_start, point_end];

    if (point_current != null)
        drawObjects.push(point_current)
    if (point_rotator != null)
    {
        drawObjects.push(point_rotator)
    }

    return drawObjects

}

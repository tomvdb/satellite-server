/* global satellite moment */
/* exported calcPolarPlotSVG */

/**
 * @typedef {Object} timeframe
 * @property {Date} start - Start of the observation.
 * @property {Date} end - End of the observation.
 */

/**
 * Returns a polar plot of a pass at the given groundstation as SVG in a string.
 *
 * @param {timeframe} Timeframe of the oberservation.
 * @param {groundstation} The observing groundstation.
 * @param {tleLine1} TLE line 1 of the observed satellite.
 * @param {tleLine2} TLE line 2 of the observed satellite.
 */
function calcPolarPlotSVG(timeframe, groundstation, tleLine1, tleLine2) {
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

    var polarGetXY = function(az, el) {
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
        var positionEci   = positionAndVelocity.position;
        var positionEcf   = satellite.eciToEcf(positionEci, gmst);

        var lookAngles    = satellite.ecfToLookAngles(observerGd, positionEcf);

        return {'azimuth':   lookAngles.azimuth * rad2deg,
            'elevation': lookAngles.elevation * rad2deg};
    }


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

    // sat visible now ?
    var sky_position_current = polarGetAzEl(new dayjs(new Date()));
    if  (sky_position_current.elevation > 0 )
    {
        var point_current = document.createElementNS(svg_namespace, 'circle');
        point_current.setAttributeNS(null, 'fill', 'green');
        point_current.setAttributeNS(null, 'stroke', 'black');
        point_current.setAttributeNS(null, 'stroke-width', '1');
    
        var coord_set = polarGetXY(sky_position_current.azimuth, sky_position_current.elevation);
    
        point_current.setAttribute('cx', coord_set.x);
        point_current.setAttribute('cy', coord_set.y);
        point_current.setAttribute('r', 7);
    }

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


    if ( point_current == null)
        return [polarOrbit, point_start, point_end];
    else
        return [polarOrbit, point_start, point_end, point_current];

}

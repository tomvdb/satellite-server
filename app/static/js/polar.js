/* exported polarplot */

function polarplot() {
    'use strict';

    function drawPolarPlot(canvas, data) {
        var ctx = canvas.getContext('2d');
        var centerΧ = ctx.canvas.width / 2;
        var centerY = ctx.canvas.height / 2;
        var canvasSize = Math.min(ctx.canvas.width, ctx.canvas.height);
        var altUnit = canvasSize/(2.5 * 90);
        var fontRatio = 0.07;
        var radius;
        var radians;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        //Draw altitude circles
        ctx.beginPath();
        var altCircles = [90, 60, 30];
        for (var i=0; i < altCircles.length; i++) {
            radius = altCircles[i] * altUnit;
            ctx.moveTo(centerΧ + radius,centerY);
            for(var th=1;th<=360;th+=1) {
                radians = (Math.PI/180) * th;
                ctx.lineTo(centerΧ + radius * Math.cos(radians),centerY + radius * Math.sin(radians));
            }
        }

        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.stroke();
        //Draw axis and letters
        radius = 96 * altUnit;
        ctx.moveTo(centerΧ, centerY);
        ctx.lineTo(centerΧ, centerY + radius);
        ctx.moveTo(centerΧ, centerY);
        ctx.lineTo(centerΧ, centerY-radius);
        ctx.moveTo(centerΧ, centerY);
        ctx.lineTo(centerΧ + radius, centerY);
        ctx.moveTo(centerΧ, centerY);
        ctx.lineTo(centerΧ-radius, centerY);

        radius = 98 * altUnit;
        ctx.font = (canvasSize * fontRatio) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('N', centerΧ, centerY - radius);
        ctx.textBaseline = 'top';
        ctx.fillText('S', centerΧ, centerY + radius);
        ctx.strokeStyle = '#000000';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('W', centerΧ - radius, centerY);
        ctx.textAlign = 'left';
        ctx.fillText('E', centerΧ + radius, centerY);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        //Draw data
        ctx.beginPath();
        radians = (Math.PI/180) * (data[0][1] - 90);
        radius = (90 - data[0][0]) * altUnit;
        ctx.moveTo(centerΧ + radius * Math.cos(radians),centerY + radius * Math.sin(radians));

        var dataLength = data.length;
        for (var j=1; j< dataLength; j++) {
            radians = (Math.PI/180) * (data[j][1] - 90);
            radius = (90 - data[j][0] ) * altUnit;
            ctx.lineTo(centerΧ + radius * Math.cos(radians),centerY + radius * Math.sin(radians));
        }
        ctx.strokeStyle = 'rgb(0, 0, 255)';
        ctx.lineWidth = 2;
        ctx.stroke();

        //Draw start and end
        radians = (Math.PI/180) * (data[0][1] - 90);
        ctx.beginPath();
        ctx.arc(centerΧ + radius * Math.cos(radians),centerY + radius * Math.sin(radians), 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'lightgreen';
        ctx.fill();

        radians = (Math.PI/180) * (data[dataLength-1][1] - 90);
        ctx.beginPath();
        ctx.arc(centerΧ + radius * Math.cos(radians),centerY + radius * Math.sin(radians), 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    $('.polar-plot').each(function(){
        var $this = $(this);
        drawPolarPlot($this.get(0), $this.data().points);
    });
}

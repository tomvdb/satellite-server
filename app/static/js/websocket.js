

var ws = null;

function connectWS(host, onopen, onclose, onmessage)
{
    console.log("Connecting to websocket");

    ws = new WebSocket(host);

    
    ws.onopen = function(event)
    {
        onopen(event);
    }

    ws.onmessage = function(event) 
    {
        onmessage(event)
    }

    ws.onclose = function(event)
    {
        onclose(event)
    }
}

function sendWS(data)
{
    if ( ws == null )
    {
        console.log("websocket not connected");
    }

    console.log("Sending on websocket");

    ws.send(JSON.stringify(data));
}
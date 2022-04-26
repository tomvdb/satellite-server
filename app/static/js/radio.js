var radioConnected = false;

function connectRadio()
{
  if ( radioConnected == true )
  {
    return;
  }

  try {

    radio_header.innerHTML = "Radio Control <span class='badge bg-danger'>Connecting</span>";

    connectWS("ws://localhost:1880/ws/radio", radioConnectionOpen, radioConnectionClosed, radioConnectionMessageReceived);
  }
  catch (err) {
    console.log("Couldn't connect to radio websocket")
  }

}

function radioConnectionOpen(event) {
  console.log("Radio Connected");

  radio_header.innerHTML = "Radio Control <span class='badge bg-success'>Connected</span>";

  radioConnected = true;
  $("#radioEnabled").attr("disabled", false);
}

function radioConnectionClosed(event) {
    radio_header.innerHTML = "Radio Control <a onClick='connectRadio()'><span class='badge bg-danger'>Disconnected</span></a>";

  $("#radioEnabled").attr("disabled", true);

  console.log("Radio Disconnected");
  radioConnected = false;
}

function radioConnectionMessageReceived(event) {
  console.log(JSON.parse(event.data))

  radioData = JSON.parse(event.data)
  /*
  azActual = rotatorData.az;
  elActual = rotatorData.el;
  rot_actual_el.innerHTML = rotatorData.el;
  rot_actual_az.innerHTML = rotatorData.az;
  */
}
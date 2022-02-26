var rotatorConnected = false;
var azActual = -1
var elActual = -1

function connectRotator()
{
  if ( rotatorConnected == true )
  {
    return;
  }

  try {

    rotator_header.innerHTML = "Rotator Control <span class='badge bg-danger'>Connecting</span>";

    connectWS("ws://localhost:1880/ws/rotator", rotatorConnectionOpen, rotatorConnectionClosed, rotatorConnectionMessageReceived);
  }
  catch (err) {
    console.log("Couldn't connect to rotator websocket")
  }

}

function rotatorConnectionOpen(event) {
  console.log("Rotator Connected");

  rotator_header.innerHTML = "Rotator Control <span class='badge bg-success'>Connected</span>";

  rotatorConnected = true;
  $("#rotatorEnabled").attr("disabled", false);
}

function rotatorConnectionClosed(event) {
  rotator_header.innerHTML = "Rotator Control <a onClick='connectRotator()'><span class='badge bg-danger'>Disconnected</span></a>";

  $("#rotatorEnabled").attr("disabled", true);

  console.log("Rotator Disconnected");
  rotatorConnected = false;
}

function rotatorConnectionMessageReceived(event) {
  console.log(JSON.parse(event.data))

  rotatorData = JSON.parse(event.data)
  azActual = rotatorData.az;
  elActual = rotatorData.el;
  rot_actual_el.innerHTML = rotatorData.el;
  rot_actual_az.innerHTML = rotatorData.az;
}
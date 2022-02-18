function rotatorConnectionOpen(event) {
    console.log("Rotator Connected");
  }

  function rotatorConnectionClosed(event) {
    console.log("Rotator Disconnected");
  }

  function rotatorConnectionMessageReceived(event) {
    console.log(JSON.parse(event.data))

    rotatorData = JSON.parse(event.data)
    rot_actual_el.innerHTML = rotatorData.el;
    rot_actual_az.innerHTML = rotatorData.az;
  }
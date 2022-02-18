# satellite-server

Use raspberry pi imager to flash raspberry pi os lite (tested with 2022-01-28 release)

sudo apt-get update
sudo apt-get install git
sudo apt-get install python3-pip
sudo apt-get install python3-numpy

git clone https://github.com/tomvdb/satellite-server.git
cd satellite-server
pip install -r requirements.txt
python db_create.py

configure qth coordinates

nano -w app/config.json

python satserver.py

add a satellite
iss - 25544

add satellite to default collection

tracking should now show up on homepag




# Credit
<a href="https://www.flaticon.com/free-icons/satellite" title="satellite icons">Satellite icons created by Freepik - Flaticon</a>
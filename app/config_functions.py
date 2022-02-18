import json

class Config:

    config_data = None
    config_path = None

    def load_config(self,config_file):
        with open(config_file, "r") as f:
            self.config_data = json.load(f)
            self.config_path = config_file
        return self.config_data

    def save_config(self):
        with open(self.config_path, 'w') as outfile:
            json.dump(self.config_data, outfile)

    def create_empty_config(self, config_file):
        self.config_data = {
            'qth_latitude' : 0,
            'qth_longitude' : 0,
        }

        self.config_path = config_file

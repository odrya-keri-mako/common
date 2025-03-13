# Import require files
import os
import sys
import traceback
import json
import importlib.util
from util import Util

class Env:

  # Set properties
  _instance = None
  app_paths = []

  # Create environment instance
  def __new__(cls):
    if cls._instance is None:
      cls._instance = super(Env, cls).__new__(cls)
      cls._instance._initialize()
    return cls._instance

  # Singleton constructor
  def _initialize(self):
    self.set_env()
    self.set_error_handling()
    self.get_application_path()
    # self.set_autoload()

  # Set environment configurations
  def set_env(self):
    os.environ["PYTHONIOENCODING"] = "utf-8"

  # Set custom error handling
  def set_error_handling(self):
    sys.excepthook = self.custom_error_handler

  # Custom error handler
  def custom_error_handler(self, exc_type, exc_value, exc_traceback):
    error = {
      "type": exc_type.__name__,
      "message": str(exc_value),
      "trace": traceback.format_tb(exc_traceback)
    }
    Util.set_error(json.dumps(error))

  # Get application paths
  def get_application_path(self):
    self.app_paths.append(os.path.abspath("."))
    self.app_paths.append(os.path.dirname(os.path.abspath(__file__)))

  # Search for file
  def search_for_file(self, filename):
    for path in self.app_paths:
      file_path = os.path.join(path, filename)
      if os.path.isfile(file_path):
        return file_path
    return None

  # Set autoimport
  def set_autoload(self):
    def load_module(module_name, file_path):
      spec = importlib.util.spec_from_file_location(module_name, file_path)
      module = importlib.util.module_from_spec(spec)
      spec.loader.exec_module(module)
      return module

    for path in self.app_paths:
      for file in os.listdir(path):
        if file.endswith(".py") and file not in ["env.py", "util.py", "database.py"]:
          load_module(file[:-3], os.path.join(path, file))

Env()

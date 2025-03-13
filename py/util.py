import json
import base64
import sys

class Util:

  # Set result
  result = {"data": None, "error": None}

  # Check is error
  @staticmethod
  def is_error():
    return Util.result["error"] is not None

  # Set error
  @staticmethod
  def set_error(msg="Unknown error!"):
    Util.result["error"] = msg.strip() if isinstance(msg, str) and msg.strip() else "Unknown error!"
    Util.set_response()

  # Set response
  @staticmethod
  def set_response(data=None):
    Util.result["data"] = data
    print(Util.json_encode(Util.result))
    sys.exit(1 if Util.is_error() else 0)

  # JSON decode (convert json string to data)
  @staticmethod
  def json_decode(var):
    try:
      return json.loads(var)
    except json.JSONDecodeError:
      Util.set_error("Unable to decode JSON string!")

  # JSON encode (convert data to json string)
  @staticmethod
  def json_encode(var):
    return json.dumps(var, separators=(",", ":"))

  # Base64 encode
  @staticmethod
  def base64_encode(data):
    return base64.b64encode(data.encode()).decode()

  # Base64 decode
  @staticmethod
  def base64_decode(data):
    try:
      return base64.b64decode(data + "==="[:len(data) % 4]).decode()
    except base64.binascii.Error:
      Util.set_error("Invalid Base64 string!")

  # Check if array is associative
  @staticmethod
  def is_assoc_array(arr):
    return isinstance(arr, dict)

  # Convert array of associative arrays to simple array
  @staticmethod
  def array_of_assoc_array_to_array(arr, fix_value=None):
    return [fix_value, *list(arr.values())] if fix_value else list(arr.values())

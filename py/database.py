import sqlite3
import mysql.connector
from util import Util
from environment import Env

class Database:
  def __init__(self, db_name=None, use_mysql=False):
    self.db_handle = None
    self.conn = self.set_connection(db_name, use_mysql)
    self.connect()

  def set_connection(self, db_name, use_mysql):
    if use_mysql:
      file = Env().search_for_file("db_config.json")
      conn = Util.json_decode(open(file).read()) if file else {}

      default_conn = {
        "host": "localhost",
        "dbname": db_name if db_name else "",
        "user": "root",
        "pass": "",
      }
      return {**default_conn, **conn}
    return db_name or ":memory:"

  def connect(self):
    try:
      if isinstance(self.conn, dict):  # MySQL
        self.db_handle = mysql.connector.connect(
          host=self.conn["host"],
          user=self.conn["user"],
          password=self.conn["pass"],
          database=self.conn["dbname"],
          use_unicode=True,
          charset="utf8",
        )
      else:  # SQLite
        self.db_handle = sqlite3.connect(self.conn)

    except Exception as e:
      Util.set_error(f"Database connection error: {str(e)}")

  def execute(self, query, params=None):
    try:
      options = {'buffered':True, 'dictionary':True}
      cursor = self.db_handle.cursor(**options) 
      cursor.execute(query, params or ())
      if query.strip().upper().startswith("SELECT"):
        return cursor.fetchall()
      self.db_handle.commit()
      return cursor.rowcount
    except Exception as e:
      Util.set_error(f"Query execution error: {str(e)}")

import os
basedir = os.path.abspath(os.path.dirname(__file__))

if not os.path.isfile("key.ini"):
    open("key.ini", "w").write(str(os.urandom(24)))
KEY = open("key.ini").readline().replace("\n", "")


class Config(object):
    SECRET_KEY = KEY
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or "sqlite:///" + os.path.join(basedir, "app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

import sys, os

INTERP = os.path.expanduser("~/projects/garni_app_env/bin/python3.11")

if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.append("~/projects/garni_app_env")

if True:
    from garni_app.garni_app import app as application

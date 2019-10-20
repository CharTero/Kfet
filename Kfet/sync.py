import json
import requests
from Kfet.exceptions import InvalidUrl, InvalidLogin
from os.path import isfile
from datetime import datetime
from dateutil.parser import parse


class Sync:
    def __init__(self, url, login):
        self.url = url
        self.login = login
        self.token = None
        self.auth()

        if not isfile("db.json"):
            with open("db.json", "w") as db:
                json.dump({"users": [], "commands": []}, db)

    def auth(self):
        if self.token:
            try:
                if requests.get(self.url+"/users", json=self.token).status_code == 401:
                    raise ValueError
            except ValueError:
                pass
            except requests.exceptions.ConnectionError:
                raise ConnectionError
            else:
                return self.token

        token = None
        try:
            token = requests.post(self.url+"/auth", json=self.login).json()["access_token"]
        except requests.exceptions.MissingSchema:
            raise InvalidUrl
        except (json.JSONDecodeError, KeyError):
            raise InvalidLogin
        except requests.exceptions.ConnectionError:
            raise ConnectionError
        self.token = {"Authorization": f"jwt {token}"}
        return self.token

    def get_data(self):
        try:
            users = requests.get(self.url+"/users", headers=self.auth()).json()
            commands = requests.get(self.url+"/commands", headers=self.auth()).json()
        except (json.JSONDecodeError, requests.exceptions.ConnectionError):
            raise ConnectionError
        return {"users": users, "commands": commands}

    def pull_data(self):
        remote = self.get_data()
        with open("db.json", "r") as db:
            local = json.load(db)

        for key in remote:
            for rdata in remote[key]:
                found = False
                for i, ldata in enumerate(local[key]):
                    if rdata["id"] == ldata["id"]:
                        found = True
                        if parse(rdata["last_update"]) > parse(ldata["last_update"]):
                            local[key][i] = rdata
                        break
                if not found:
                    local[key].append(rdata)

        with open("db.json", "w") as db:
            json.dump(local, db)

    def push_data(self):
        remote = self.get_data()
        with open("db.json", "r") as db:
            local = json.load(db)

        for key in remote:
            for ldata in local[key]:
                found = False
                for rdata in remote[key]:
                    if ldata["id"] == rdata["id"]:
                        found = True
                        if parse(ldata["last_update"]) > parse(rdata["last_update"]):
                            requests.put(self.url+"/"+key+"/"+str(ldata["id"]), headers=self.auth(), json=ldata)
                        break
                if not found:
                    requests.post(self.url+"/"+key, headers=self.auth(), json=ldata)
        self.pull_data()


if __name__ == "__main__":
    s = Sync("http://127.0.0.1:5000", {"id": 1, "password": "test"})
    s.pull_data()
    with open("db.json", "r") as db:
        local = json.load(db)
    local["users"][0]["email"] = "ethanell@flifloo.fr"
    local["users"][0]["last_update"] = str(datetime.now())
    with open("db.json", "w") as db:
        json.dump(local, db)
    s.push_data()

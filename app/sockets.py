import datetime
import functools

from flask_login import current_user
from flask_socketio import emit, disconnect

from app import socketio, db
from app.models import User, Command, Plate, Ingredient, Sauce, Drink, Dessert, Service


def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            disconnect()
        else:
            return f(*args, **kwargs)

    return wrapped


def command_json(c):
    ingredient = " - ".join([s.id for s in c.content])
    sauces = " - ".join([s.id for s in c.sauce])
    if c.error:
        state = "error"
    elif c.give:
        state = "gave"
    elif c.done:
        state = "done"
    elif c.WIP:
        state = "WIP"
    elif c.take:
        state = "waiting"
    else:
        state = "unknown"
    try:
        client = User.query.get(c.client_id).username
    except AttributeError:
        client = None
    try:
        sandwich = User.query.get(c.sandwich_id).username
    except AttributeError:
        sandwich = None
    return {"id": c.number, "plate": c.plate_id, "ingredient": ingredient, "sauce": sauces, "drink": c.drink_id,
            "dessert": c.dessert_id, "state": state, "sandwich": sandwich, "client": client}


@socketio.on("connect")
@authenticated_only
def connect():
    print("New connection")
    emit("connect", "ok")


@socketio.on("list command")
@authenticated_only
def lscmd():
    commands = []
    for c in Command.query.filter_by(date=datetime.datetime.now().date()).all():
        commands.append(command_json(c))

    emit("list command", {"list": commands})


@socketio.on("add command")
@authenticated_only
def addcmd(json):
    c = Command()
    try:
        c.number = Command.query.filter_by(date=datetime.datetime.now().date()).order_by(
            Command.number.desc()).first().number + 1
    except AttributeError:
        c.number = 1
    c.pc_id = current_user.id
    if all(i in json and json[i] for i in ["firstname", "lastname", "client"]):
        db.session.add(User(username=json["client"], firstname=json["firstname"], lastname=json["lastname"]))
    if "client" in json:
        try:
            c.client_id = User.query.filter_by(username=json["client"]).first().id
        except AttributeError:
            c.client_id = User.query.filter_by(username="dummy").first().id
    if "plate" in json:
        try:
            c.plate_id = Plate.query.get(json["plate"]).id
        except AttributeError:
            pass
    if "ingredient" in json:
        for i in json["ingredient"]:
            try:
                c.content.append(Ingredient.query.get(i))
            except AttributeError:
                pass
    if "sauce" in json:
        for s in json["sauce"]:
            try:
                c.sauce.append(Sauce.query.get(s))
            except AttributeError:
                pass
    if "drink" in json:
        try:
            c.drink_id = Drink.query.get(json["drink"]).id
        except AttributeError:
            pass
    if "dessert" in json:
        try:
            c.dessert_id = Dessert.query.get(json["dessert"]).id
        except AttributeError:
            pass
    db.session.add(c)
    db.session.commit()
    emit("new command", command_json(c), broadcast=True)


@socketio.on("clear command")
@authenticated_only
def rmcmd(json):
    c = Command.query.filter_by(date=datetime.datetime.now().date(), number=json["id"]).first()
    if c:
        c.done = None
        c.give = None
        c.error = False
        service = Service.query.filter_by(date=datetime.datetime.now().date()).first()
        if c.WIP and service:
            sandwichs = [service.sandwich1_id, service.sandwich2_id, service.sandwich3_id]
            if c.sandwich_id in sandwichs:
                setattr(service, f"sandwich{sandwichs.index(c.sandwich_id)+1}", False)
            c.WIP = False
        db.session.commit()
        emit("cleared command", {"id": json["id"]}, broadcast=True)


@socketio.on("done command")
@authenticated_only
def donecmd(json):
    c = Command.query.filter_by(date=datetime.datetime.now().date(), number=json["id"]).first()
    if c:
        c.done = datetime.datetime.now().time()
        service = Service.query.filter_by(date=datetime.datetime.now().date()).first()
        if service and c.WIP:
            sandwichs = [service.sandwich1_id, service.sandwich2_id, service.sandwich3_id]
            if c.sandwich_id in sandwichs:
                setattr(service, f"sandwich{sandwichs.index(c.sandwich_id)+1}", False)
        c.WIP = False
        db.session.commit()
        emit("finish command", {"id": json["id"]}, broadcast=True)


@socketio.on("give command")
@authenticated_only
def givecmd(json):
    c = Command.query.filter_by(date=datetime.datetime.now().date(), number=json["id"]).first()
    if c:
        c.give = datetime.datetime.now().time()
        service = Service.query.filter_by(date=datetime.datetime.now().date()).first()
        if service and c.WIP:
            sandwichs = [service.sandwich1_id, service.sandwich2_id, service.sandwich3_id]
            if c.sandwich_id in sandwichs:
                setattr(service, f"sandwich{sandwichs.index(c.sandwich_id)+1}", False)
        c.WIP = False
        db.session.commit()
        emit("gave command", {"id": json["id"]}, broadcast=True)


@socketio.on("WIP command")
@authenticated_only
def wipcmd(json):
    c = Command.query.filter_by(date=datetime.datetime.now().date(), number=json["id"]).first()
    if c:
        c.WIP = True
        service = Service.query.filter_by(date=datetime.datetime.now().date()).first()
        sandwich = None
        if service:
            sandwichs = [service.sandwich1, service.sandwich2, service.sandwich3]
            for i, s in enumerate(sandwichs):
                if not s:
                    setattr(service, f"sandwich{i+1}", True)
                    c.sandwich_id = getattr(service, f"sandwich{i+1}_id")
                    sandwich = User.query.get(c.sandwich_id).username
                    break
        db.session.commit()
        emit("WIPed command", {"id": json["id"], "sandwich": sandwich}, broadcast=True)


@socketio.on("error command")
@authenticated_only
def errcmd(json):
    c = Command.query.filter_by(date=datetime.datetime.now().date(), number=json["id"]).first()
    if c:
        c.error = True
        db.session.commit()
        emit("glitched command", {"id": json["id"]}, broadcast=True)


@socketio.on("list plate")
@authenticated_only
def lsplate():
    plates = []
    for p in Plate.query.all():
        plates.append({"id": p.id, "name": p.name, "price": p.price, "avoid ingredient": p.avoid_ingredient})
    emit("list plate", {"list": plates})


@socketio.on("list ingredient")
@authenticated_only
def lsingredient():
    ingredients = []
    for i in Ingredient.query.all():
        ingredients.append({"id": i.id, "name": i.name, "price": i.price})
    emit("list ingredient", {"list": ingredients})


@socketio.on("list sauce")
@authenticated_only
def lssauce():
    sauces = []
    for s in Sauce.query.all():
        sauces.append({"id": s.id, "name": s.name, "price": s.price})
    emit("list sauce", {"list": sauces})


@socketio.on("list drink")
@authenticated_only
def lsdrink():
    drinks = []
    for d in Drink.query.all():
        drinks.append({"id": d.id, "name": d.name, "price": d.price})
    emit("list drink", {"list": drinks})


@socketio.on("list dessert")
@authenticated_only
def lsdessert():
    desserts = []
    for d in Dessert.query.all():
        desserts.append({"id": d.id, "name": d.name, "price": d.price})
    emit("list dessert", {"list": desserts})


@socketio.on("list users")
@authenticated_only
def lsusers(json=None):
    if json is None:
        json = {}
    users = User.query.all()
    users_list = []
    for u in users:
        if not json or "user" not in json or json["user"] in u.username:
            users_list.append(u.username)
    emit("list users", {"list": users_list})


@socketio.on("list service")
@authenticated_only
def lsservice(json=None, broadcast=False):
    service = Service.query.filter_by(date=datetime.datetime.now().date()).first()
    s = {}
    if service:
        for i in [["pc", service.pc_id], ["sandwich1", service.sandwich1_id], ["sandwich2", service.sandwich2_id],
                  ["sandwich3", service.sandwich3_id], ["commi1", service.commi1_id], ["commi2", service.commi2_id]]:
            s[i[0]] = User.query.get(i[1]).username
    emit("list service", s, broadcast=broadcast)


@socketio.on("set service")
@authenticated_only
def setservice(json):
    service = Service.query.filter_by(date=datetime.datetime.now().date()).first()
    if not service:
        service = Service()
    if all(i in json and json[i] for i in ["pc", "sandwich1", "sandwich2", "sandwich3", "commi1", "commi2"]):
        for i in [["pc", "pc_id"], ["sandwich1", "sandwich1_id"], ["sandwich2", "sandwich2_id"],
                  ["sandwich3", "sandwich3_id"], ["commi1", "commi1_id"], ["commi2", "commi2_id"]]:
            setattr(service, i[1], User.query.filter_by(username=json[i[0]]).first().id)
    else:
        dummy = User.query.filter_by(username="dummy").first().id
        for i in ["pc_id", "sandwich1_id","sandwich2_id", "sandwich3_id", "commi1_id", "commi2_id"]:
            setattr(service, i[1], dummy)
    service.sandwich1 = False
    service.sandwich2 = False
    service.sandwich3 = False
    if not service.date:
        db.session.add(service)
    db.session.commit()
    lsservice(broadcast=True)


@socketio.on("add user")
@authenticated_only
def adduser(json):
    if all(i in json and json[i] for i in ["username", "firstname", "lastname"]):
        u = User(username=json["username"], firstname=json["firstname"], lastname=json["lastname"])
        if "password" in json:
            u.set_password(json["password"])
        db.session.add(u)
        db.session.commit()

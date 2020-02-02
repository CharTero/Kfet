import datetime
import functools

from flask_login import current_user
from flask_socketio import emit, disconnect

from app import socketio, db
from app.models import User, Command, Plate, Ingredient, Sauce, Drink, Dessert


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
    elif c.take:
        state = "waiting"
    else:
        state = "unknown"
    return {"id": c.number, "plate": c.plate_id, "ingredient": ingredient, "sauce": sauces, "drink": c.drink_id,
            "dessert": c.dessert_id, "state": state}


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
    c = Command.query.get(json["id"])
    if c:
        c.done = None
        c.give = None
        c.error = False
        db.session.commit()
        emit("cleared command", {"id": json["id"]}, broadcast=True)


@socketio.on("done command")
@authenticated_only
def donecmd(json):
    c = Command.query.get(json["id"])
    if c:
        c.done = datetime.datetime.now().time()
        db.session.commit()
        emit("finish command", {"id": json["id"]}, broadcast=True)


@socketio.on("give command")
@authenticated_only
def givecmd(json):
    c = Command.query.get(json["id"])
    if c:
        c.give = datetime.datetime.now().time()
        db.session.commit()
        emit("gave command", {"id": json["id"]}, broadcast=True)


@socketio.on("error command")
@authenticated_only
def errcmd(json):
    c = Command.query.get(json["id"])
    if c:
        c.error = True
        db.session.commit()
        emit("glitched command", {"id": json["id"]}, broadcast=True)


@socketio.on("list plate")
@authenticated_only
def lsplate():
    plates = []
    for p in Plate.query.all():
        plates.append({"id": p.id, "name": p.name})
    emit("list plate", {"list": plates})


@socketio.on("list ingredient")
@authenticated_only
def lsingredient():
    ingredients = []
    for p in Ingredient.query.all():
        ingredients.append({"id": p.id, "name": p.name})
    emit("list ingredient", {"list": ingredients})


@socketio.on("list sauce")
@authenticated_only
def lssauce():
    sauces = []
    for p in Sauce.query.all():
        sauces.append({"id": p.id, "name": p.name})
    emit("list sauce", {"list": sauces})


@socketio.on("list drink")
@authenticated_only
def lsdrink():
    drinks = []
    for p in Drink.query.all():
        drinks.append({"id": p.id, "name": p.name})
    emit("list drink", {"list": drinks})


@socketio.on("list dessert")
@authenticated_only
def lsdessert():
    desserts = []
    for p in Dessert.query.all():
        desserts.append({"id": p.id, "name": p.name})
    emit("list dessert", {"list": desserts})


@socketio.on("list users")
@authenticated_only
def lsusers(json):
    users = User.query.all()
    users_list = []
    for u in users:
        if not json or "user" not in json or json["user"] in u.username:
            users_list.append(u.username)
    emit("list users", {"list": users_list})

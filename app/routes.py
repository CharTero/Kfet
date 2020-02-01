import datetime
import functools

from flask import render_template, redirect, url_for, flash, request
from flask_login import current_user, login_user, logout_user, login_required
from flask_socketio import emit, disconnect
from werkzeug.urls import url_parse

from app import app, socketio, db
from app.forms import LoginForm
from app.models import User, Command, Plate, Ingredient, Sauce, Drink, Dessert


def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            disconnect()
        else:
            return f(*args, **kwargs)
    return wrapped


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash("Invalid username or password")
            return redirect(url_for("login"))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get("next")
        if not next_page or url_parse(next_page).netloc != "":
            next_page = url_for("index")
        return redirect(next_page)
    return render_template("login.html", form=form)


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("index"))


@app.route("/")
@app.route("/index")
def index():
    return render_template("test.html")


@app.route("/pc")
@login_required
def pc():
    return render_template("pc.html")


@app.route("/stocks")
@login_required
def stocks():
    return render_template("stocks.html")


@app.route("/menu")
@login_required
def menu():
    return render_template("menu.html")


def command_json(c):
    content = " - ".join([s.id for s in c.content])
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
    return {"id": c.number, "plate": c.plate_id, "content": content, "sauce": sauces, "drink": c.drink_id, "dessert": c.dessert_id, "state": state}


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
    # TODO: add auto disable checkbox when no plate selected or specific plate


@socketio.on("add command")
@authenticated_only
def addcmd(json):
    c = Command()
    try:
        c.number = Command.query.filter_by(date=datetime.datetime.now().date()).order_by(Command.number.desc()).first().number+1
    except AttributeError:
        c.number = 1

    if "pc" in json:
        try:
            c.pc_id = User.query.get(json["pc"]).id
        except AttributeError:
            c.pc_id = 0
    if "sandwitch" in json:
        try:
            c.sandwitch_id = User.query.get(json["sandwitch"]).id
        except AttributeError:
            c.sandwitch_id = 0
    if "client" in json:
        try:
            c.client_id = User.query.get(json["client"]).id
        except AttributeError:
            c.client_id = 0
    if "plate" in json:
        try:
            c.plate_id = Plate.query.get(json["plate"]).id
        except AttributeError:
            pass
    if "content" in json:
        for i in json["content"]:
            try:
                c.content.append(Ingredient.query.get(i))
            except AttributeError:
                pass
    if "sauce" in json:
        for s in json["sauce"]:
            try:
                c.sauce.append(Sauce.guery.get(s))
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

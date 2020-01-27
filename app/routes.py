import functools

from flask import render_template, redirect, url_for, flash, request
from flask_login import current_user, login_user, logout_user, login_required
from flask_socketio import emit, disconnect
from werkzeug.urls import url_parse

from app import app, socketio
from app.forms import LoginForm
from app.models import User


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


commands = [
    {
        "id": 1,
        "plate": "sanddwitch",
        "content": "Jambon - Tomate - Brie",
        "sauce": "curry",
        "drink": "Boisson surprise",
        "dessert": "Panini nutella",
        "state": "waiting"
    },
    {
        "id": 2,
        "plate": "sanddwitch",
        "content": "Jambon - Tomate - Brie",
        "sauce": "bbc",
        "drink": "Boisson surprise",
        "dessert": "Panini nutella",
        "state": "gave"
    },
    {
        "id": 3,
        "plate": "sanddwitch",
        "content": "Jambon - Tomate - Brie",
        "sauce": "mayo",
        "drink": "Boisson surprise",
        "dessert": "Panini nutella",
        "state": "error"
    }
]


@socketio.on("connect")
@authenticated_only
def connect():
    print("New connection")
    emit("connect", "ok")


@socketio.on("list command")
@authenticated_only
def lscmd():
    emit("list command", {"list": commands, "idcom": len(commands)})


@socketio.on("add command")
@authenticated_only
def addcmd(json):
    commands.append({"id": len(commands)+1, "plate": json["plate"], "content": json["content"], "sauce": json["sauce"], "drink": json["drink"], "dessert": json["dessert"], "state": "waiting"})
    emit("new command", commands[-1], broadcast=True)


@socketio.on("clear command")
@authenticated_only
def rmcmd(json):
    for i, c in enumerate(commands):
        if c["id"] == json["id"]:
            c["state"] = "waiting"
            break
    emit("cleared command", {"id": json["id"]}, broadcast=True)


@socketio.on("give command")
@authenticated_only
def givecmd(json):
    for i, c in enumerate(commands):
        if c["id"] == json["id"]:
            c["state"] = "gave"
            break
    emit("gave command", {"id": json["id"]}, broadcast=True)


@socketio.on("error command")
@authenticated_only
def errcmd(json):
    for i, c in enumerate(commands):
        if c["id"] == json["id"]:
            c["state"] = "error"
            break
    emit("glitched command", {"id": json["id"]}, broadcast=True)

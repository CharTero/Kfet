from flask import render_template, redirect, url_for, flash, request
from flask_login import current_user, login_user, logout_user, login_required
from flask_socketio import emit
from werkzeug.urls import url_parse

from app import app, socketio
from app.forms import LoginForm
from app.models import User


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
def root():
    return render_template("pc.html")


@socketio.on("connect")
def test_connect():
    emit("my response", {"data": "Connected"})


@socketio.on("disconnect")
def test_disconnect():
    print("Client disconnected")


@socketio.on("message")
def handle_message(message):
    print("received message: " + message)


@socketio.on("my event")
def handle_my_custom_event(json):
    print("received json: " + str(json))

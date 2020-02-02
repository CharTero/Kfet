from flask import render_template, redirect, url_for, flash, request
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse

from app import app
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


@app.route("/cuisine")
@login_required
def cuisine():
    return render_template("cuisine.html")


@app.route("/service")
@login_required
def service():
    return render_template("equipe.html")

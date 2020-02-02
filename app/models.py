import datetime

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app import db
from app import login


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String, index=True, unique=True)
    password_hash = db.Column(db.String)
    firstname = db.Column(db.String, nullable=False)
    lastname = db.Column(db.String, nullable=False)

    command = db.relationship("Command", backref="client", lazy="dynamic", foreign_keys="Command.client_id")
    pc_command = db.relationship("Command", backref="pc", lazy="dynamic", foreign_keys="Command.pc_id")
    sandwitch_command = db.relationship("Command", backref="sandwitch", lazy="dynamic", foreign_keys="Command.sandwitch_id")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"


@login.user_loader
def load_user(id):
    return User.query.get(int(id))


class Command(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False)

    pc_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    sandwitch_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    client_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    date = db.Column(db.Date, default=datetime.datetime.now().date)
    take = db.Column(db.Time, default=datetime.datetime.now().time)
    done = db.Column(db.Time)
    give = db.Column(db.Time)
    WIP = db.Column(db.Boolean, default=False)
    error = db.Column(db.Boolean, default=False)

    plate_id = db.Column(db.String, db.ForeignKey("plate.id"))
    content = db.relationship("Ingredient", secondary="get")
    sauce = db.relationship("Sauce", secondary="cover")
    drink_id = db.Column(db.String, db.ForeignKey("drink.id"))
    dessert_id = db.Column(db.String, db.ForeignKey("dessert.id"))

    def __repr__(self):
        return f"<Command N°{self.number} {self.date}>"


class Plate(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

    command = db.relationship("Command", backref="plate", lazy="dynamic")

    def __repr__(self):
        return f"<Plate {self.id}>"


class Ingredient(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

    command = db.relationship("Command", secondary="get")

    def __repr__(self):
        return f"<Ingredient {self.id}>"


class Get(db.Model):
    command_id = db.Column(db.Integer, db.ForeignKey("command.id"), primary_key=True)
    ingredient_id = db.Column(db.String, db.ForeignKey("ingredient.id"), primary_key=True)

    command = db.relationship("Command", backref="get")
    content = db.relationship("Ingredient", backref="get")


class Sauce(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

    command = db.relationship("Command", secondary="cover")

    def __repr__(self):
        return f"<Sauce {self.id}>"


class Cover(db.Model):
    command_id = db.Column(db.Integer, db.ForeignKey("command.id"), primary_key=True)
    sauce_id = db.Column(db.String, db.ForeignKey("sauce.id"), primary_key=True)

    command = db.relationship("Command", backref="cover")
    sauce = db.relationship("Sauce", backref="cover")


class Drink(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

    command = db.relationship("Command", backref="drink", lazy="dynamic")

    def __repr__(self):
        return f"<Drink {self.id}>"


class Dessert(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

    command = db.relationship("Command", backref="dessert", lazy="dynamic")

    def __repr__(self):
        return f"<Dessert {self.id}>"


class Service(db.Model):
    sandwitch1_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    sandwitch2_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    sandwitch3_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    date = db.Column(db.Date, default=datetime.datetime.now().date, primary_key=True, unique=True)

    sandwitch1 = db.Column(db.Boolean, default=False)
    sandwitch2 = db.Column(db.Boolean, default=False)
    sandwitch3 = db.Column(db.Boolean, default=False)
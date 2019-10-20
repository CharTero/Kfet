class InvalidUrl(Exception):
    def __init__(self, expression, message):
        self.expression = expression
        self.message = message


class InvalidLogin(Exception):
    def __init__(self, expression, message):
        self.expression = expression
        self.message = message

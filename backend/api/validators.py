from django.core.exceptions import ValidationError
import re

class ComplexPasswordValidator:
    
    def validate(self, password, user=None):
        big = False
        number = False
        special = False
        count = 0
        if not re.findall(r'[A-Z]', password):
            big = True
            count = count + 1
        if not re.findall(r'\d', password):
            number = True
            count = count + 1
        if not re.findall(r'[!@#$%^&*(),.?":{}|<>]', password):
            special = True
            count = count + 1
        if count != 0:
            errorMsg = "Hasło jest zbyt proste. Należy dodać do niego "
        else:
            errorMsg = ""
        if count == 1:
            if big:
                errorMsg+="dużą literę."
            if number:
                errorMsg+="cyfrę."
            if special:
                errorMsg+="znak specjalny."
        if count == 2:
            if big and number:
                errorMsg+="dużą literę i cyfrę."
            elif big and special:
                errorMsg+="dużą literę i znak specjalny."
            elif number and special:
                errorMsg+="cyfrę i znak specjalny."
        if big and special and number:
            errorMsg+="dużą literę, cyfrę i znak specjalny."
        if count != 0:
            raise ValidationError(errorMsg)
    def get_help_text(self):
        return "Twoje hasło musi zawierać wielką literę, cyfrę i znak specjalny."
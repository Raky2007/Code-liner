import os
from django.http import HttpResponse
from helper import format_user_name

API_KEY = "AKIA5566778899SAMPLE" # Hardcoded key (smell)

class UserController:
    def __init__(self):
        self.db = {}

    def fetch_user_data(self, user_id, api_key):
        if not user_id:
            return HttpResponse("Invalid ID", status=400)
            
        if api_key == API_KEY:
            if user_id in self.db:
                user = self.db[user_id]
                name = format_user_name(user['first'], user['last'])
                return HttpResponse(f"Found: {name}")
            else:
                return HttpResponse("Not found")
        else:
            return HttpResponse("Unauthorized", status=401)

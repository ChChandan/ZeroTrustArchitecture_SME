from flask import Flask, redirect, url_for, session
from authlib.integrations.flask_client import OAuth

app = Flask(__name__)
app.secret_key = "your_random_secret_key"  # replace with something secure

# Keycloak Config
KEYCLOAK_BASE_URL = "http://localhost:8080/realms/master/protocol/openid-connect"
CLIENT_ID = "flask-app"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"

oauth = OAuth(app)
keycloak = oauth.register(
    name="keycloak",
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    access_token_url=f"{KEYCLOAK_BASE_URL}/token",
    authorize_url=f"{KEYCLOAK_BASE_URL}/auth",
    userinfo_endpoint=f"{KEYCLOAK_BASE_URL}/userinfo",
    client_kwargs={"scope": "openid profile email"},
)

@app.route("/")
def home():
    user = session.get("user")
    if user:
        return f"Hello, {user['preferred_username']}!"
    return '<a href="/login">Login with Keycloak</a>'

@app.route("/login")
def login():
    redirect_uri = url_for("auth", _external=True)
    return keycloak.authorize_redirect(redirect_uri)

@app.route("/auth")
def auth():
    token = keycloak.authorize_access_token()
    userinfo = keycloak.userinfo()
    session["user"] = userinfo
    return redirect("/")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")
@app.route("/ping")
def ping():
    return "pong", 200
if __name__ == "__main__":
    app.run(host="0.0.0.0",port=2525, debug=True)

from flask import Flask, jsonify, redirect, url_for, session
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token

app = Flask(__name__)
app.secret_key = "chandan1234"  # keep this secret in production

# Keycloak configuration
issuer = "http://localhost:8080/realms/SME"
client_id = "flask-app"
client_secret = "Sybxfb5H1lLtsSWoFlpVp3p3gdAFFkAo"

# OAuth setup
oauth = OAuth(app)
oauth.register(
    name="keycloak",
    client_id=client_id,
    client_secret=client_secret,
    server_metadata_url=f"{issuer}/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid profile email"
    }
)

# Routes
@app.route("/")
def home():
    return '<a href="/login">Login with Keycloak</a>'

@app.route("/login")
def login():
    redirect_uri = url_for("auth", _external=True)
    nonce = generate_token()
    session["nonce"] = nonce
    return oauth.keycloak.authorize_redirect(redirect_uri, nonce=nonce)

@app.route("/auth")
def auth():
    token = oauth.keycloak.authorize_access_token()
    user = oauth.keycloak.parse_id_token(token, nonce=session.get("nonce"))
    userinfo=jsonify(user)
    #return userinfo["give_name"]+" "+userinfo["family_name"]
    return jsonify(user)

@app.route("/finance")
def finance():
    return "Welcome finance user"

@app.route("/IT")
def IT():
    return "Welcome IT user"

@app.route("/other")
def other():
    return "Welcome other user"

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=2626)

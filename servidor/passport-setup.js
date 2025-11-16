const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GoogleOneTapStrategy = require("passport-google-one-tap").GoogleOneTapStrategy;

const googleClientID = process.env.ClienteID || process.env.GOOGLE_CLIENT_ID || '';
const googleSecret = process.env.secret_key || process.env.GOOGLE_CLIENT_SECRET || '';
const baseUrl = (process.env.url || process.env.URL || 'http://localhost:3000').replace(/\/$/, '');

passport.serializeUser(function (user, done) {
    const id = (user && (user.email || (user.emails && user.emails[0] && user.emails[0].value))) || user;
    done(null, id);
});
passport.deserializeUser(function (id, done) {
    done(null, { email: id });
});

if (googleClientID && googleSecret) {
    passport.use(new GoogleStrategy({
        clientID: googleClientID,
        clientSecret: googleSecret,
        callbackURL: baseUrl + "/auth/google/callback"
    },
        function (accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    ));
} else {
    console.warn('passport-setup: Google OAuth no configurado (falta ClienteID o secret_key en .env)');
}

if (googleClientID && googleSecret) {
    try {
        passport.use(
            new GoogleOneTapStrategy(
                {
                    client_id: googleClientID,
                    clientSecret: googleSecret,
                    verifyCsrfToken: false
                },
                function (profile, done) {
                    return done(null, profile);
                }
            )
        );
    } catch (ex) {
        console.warn('passport-setup: Google One Tap no pudo inicializarse:', ex.message);
    }
}
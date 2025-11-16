require('dotenv').config();
const fs = require("fs");
const express = require('express');
const app = express();
const passport = require("passport");
const cookieSession = require('cookie-session');
const LocalStrategy = require('passport-local').Strategy;
require("./servidor/passport-setup.js");
const modelo = require("./servidor/modelo.js");
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const haIniciado = function (request, response, next) {
    if (request.user) {
        next();
    }
    else {
        response.redirect("/")
    }
};
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let sistema = new modelo.Sistema();

app.use(express.static(__dirname + "/"));

// Ensure a safe Referrer-Policy for Google Identity Services (FedCM/One Tap)
app.use(function (req, res, next) {
    try {
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    } catch (e) {
        console.error('Could not set Referrer-Policy header', e);
    }
    next();
});

app.use(cookieSession({
    name: 'Sistema',
    keys: ['key1', 'key2']
}));

app.use(passport.initialize());

app.use(passport.session());

app.use(function (req, res, next) {
    if (!req.session) req.session = {};
    if (typeof req.session.regenerate !== 'function') {
        req.session.regenerate = function (cb) {
            const newSess = {};
            newSess.regenerate = req.session.regenerate || function (cb2) { if (typeof cb2 === 'function') cb2(); };
            newSess.save = req.session.save || function (cb2) { if (typeof cb2 === 'function') cb2(); };
            newSess.reload = req.session.reload || function (cb2) { if (typeof cb2 === 'function') cb2(); };
            newSess.destroy = req.session.destroy || function (cb2) { req.session = null; if (typeof cb2 === 'function') cb2(); };
            req.session = newSess;
            if (typeof cb === 'function') cb();
        };
    }
    if (typeof req.session.save !== 'function') req.session.save = function (cb) { if (typeof cb === 'function') cb(); };
    if (typeof req.session.reload !== 'function') req.session.reload = function (cb) { if (typeof cb === 'function') cb(); };
    if (typeof req.session.destroy !== 'function') req.session.destroy = function (cb) { req.session = null; if (typeof cb === 'function') cb(); };
    next();
});

passport.use(new
    LocalStrategy({ usernameField: "email", passwordField: "password" },
        function (email, password, done) {
            sistema.loginUsuario({ "email": email, "password": password }, function (user) {

                if (!user || (user.email && user.email === -1) || (user.nick && user.nick === -1)) {
                    return done(null, false);
                }
                return done(null, user);
            })
        }
    ));


app.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/fallo' }),
    function (req, res) {
        res.redirect('/good');
    });

app.get("/good", haIniciado, async function (request, response) {
    let email = request.user.emails[0].value;

    await sistema.usuarioGoogle({ "email": email }, function (obj) {
        console.log('Usuario Google obtenido/creado:', obj.email);
        response.cookie('nick', obj.email);
        response.redirect('/');
    });
});

app.post('/oneTap/callback',
    passport.authenticate('google-one-tap', { failureRedirect: '/fallo' }),
    function (req, res) {
        res.redirect('/good');
    });

app.post('/loginUsuario', function (request, response) {
    console.log('/loginUsuario body:', request.body && request.body.email);
    sistema.loginUsuario(request.body, function (result) {
        console.log('/loginUsuario result from sistema:', result);
        if (!result) { response.send({ nick: -1 }); return; }
        if (typeof result.nick !== 'undefined') {
            response.send({ nick: result.nick });
            return;
        }
        const user = result;
        const email = user.email || user.nick || (user.emails && user.emails[0] && user.emails[0].value);
        const userForSession = { email: user.email, nick: user.nick || user.email };
        request.login(userForSession, function (err) {
            if (err) {
                console.error('req.login error:', err);
                try { request.session.user = userForSession; } catch (e) { }
            } else {
                console.log('req.login OK for', email);
            }
            try { response.cookie('nick', email); } catch (e) { console.error('cookie error:', e); }
            response.send({ nick: email });
        });
    });
});

app.post("/registrarUsuario", function (request, response) {
    console.log('/registrarUsuario body:', request.body);
    try {
        sistema.registrarUsuario(request.body, function (res) {
            console.log('/registrarUsuario result from sistema:', res);
            if (!res) return response.status(500).send({ nick: -1 });
            response.send({ "nick": res.email });
        });
    } catch (ex) {
        console.error('Error in /registrarUsuario handler:', ex);
        response.status(500).send({ nick: -1 });
    }
});


app.get("/fallo", function (request, response) {
    response.send({ nick: "nook" })
});

app.get("/confirmarUsuario/:email/:key", haIniciado, function (request, response) {
    let email = request.params.email;
    let key = request.params.key;
    sistema.confirmarUsuario({ "email": email, "key": key }, function (usr) {
        if (usr.email != -1) {
            response.cookie('nick', usr.email);
        }
        response.redirect('/');
    });
})

app.get("/", (req, res) => {
    const contenido = fs.readFileSync(__dirname + "/cliente/index.html");
    res.status(200).setHeader("Content-Type", "text/html").send(contenido);
});

app.get("/cerrarSesion", haIniciado, function (request, response) {
    let nick = request.user.nick;
    request.logout();
    response.redirect("/");
    if (nick) {
        sistema.eliminarUsuario(nick);
    }
});

app.get("/agregarUsuario/:nick", haIniciado, (req, res) => {
    const nick = req.params.nick;
    const resultado = sistema.agregarUsuario(nick);
    res.status(200).json({ nick: resultado });
});
app.get("/obtenerUsuarios", haIniciado, (req, res) => {
    const usuarios = sistema.obtenerUsuarios();
    res.status(200).json(usuarios);
});

app.get("/usuarioActivo/:nick", haIniciado, (req, res) => {
    const nick = req.params.nick;
    const activo = sistema.usuarioActivo(nick);
    res.status(200).json({ activo });
});
app.get("/numeroUsuarios", (req, res) => {
    const num = sistema.numeroUsuarios();
    res.status(200).json({ num });
});

app.get("/eliminarUsuario/:nick", haIniciado, (req, res) => {
    const nick = req.params.nick;
    const eliminado = sistema.eliminarUsuario(nick);
    res.status(200).json({ eliminado });
});

app.get('/debug/user/:email', async (req, res) => {
    try {
        const email = req.params.email;
        if (sistema.cad && sistema.cad.usuarios) {
            const u = await sistema.cad.usuarios.findOne({ email: email });
            if (!u) return res.status(404).json({ error: 'not-found' });
            const out = Object.assign({}, u);
            if (out.password) delete out.password;
            return res.json(out);
        } else {
            return res.status(503).json({ error: 'db-not-ready' });
        }
    } catch (ex) {
        console.error('debug/user error:', ex);
        res.status(500).json({ error: 'server-error' });
    }
});

// Development-only: list all users (email and password-hash hint)
app.get('/debug/users', async (req, res) => {
    try {
        if (!(sistema && sistema.cad && sistema.cad.usuarios)) return res.status(503).json({ error: 'db-not-ready' });
        const cursor = sistema.cad.usuarios.find({});
        const list = await cursor.toArray();
        const out = list.map(u => {
            const pass = u.password || '';
            const isHashed = typeof pass === 'string' && (pass.startsWith('$2a$') || pass.startsWith('$2b$') || pass.startsWith('$2y$'));
            return { email: u.email, passwordSample: isHashed ? (pass.substring(0, 6) + '...') : (pass ? 'PLAIN_TEXT' : ''), isHashed };
        });
        res.json(out);
    } catch (ex) {
        console.error('/debug/users error:', ex);
        res.status(500).json({ error: 'server-error' });
    }
});

app.post('/debug/clear-users', async (req, res) => {
    try {
        let deleted = 0;
        if (sistema.cad && sistema.cad.usuarios) {
            const result = await sistema.cad.usuarios.deleteMany({});
            deleted = result && result.deletedCount ? result.deletedCount : 0;
        }
        if (sistema && sistema.usuarios) {
            sistema.usuarios = {};
        }
        console.log('debug/clear-users: deleted', deleted);
        res.json({ deleted: deleted });
    } catch (ex) {
        console.error('debug/clear-users error:', ex);
        res.status(500).json({ error: 'server-error' });
    }
});

sistema.cad.conectar(function (db) {
    console.log('Conectado a Mongo Atlas');
    app.listen(PORT, () => {
        console.log(`App está escuchando en el puerto ${PORT}`);
        console.log('Ctrl+C para salir');
    });
});

process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('unhandledRejection at:', promise, 'reason:', reason);
});

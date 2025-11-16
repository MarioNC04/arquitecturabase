const datos = require("./cad.js");
const correo = require("./email.js");
const bcrypt = require('bcrypt');

function Sistema() {
  this.cad = new datos.CAD();
  this.cad.conectar(function (db) {
    console.log("Conectado a Mongo Atlas");
  });
  this.usuarios = {};

  this.agregarUsuario = function (nick) {
    if (!this.usuarios[nick]) {
      this.usuarios[nick] = new Usuario(nick);
      return nick;
    } else {
      console.log("el nick " + nick + " está en uso");
      return -1;
    }
  };

  this.registrarUsuario = function (obj, callback) {
    let modelo = this;
    if (!obj.nick) obj.nick = obj.email;
    console.log('registrarUsuario called with', obj.email);
    (async function () {
      try {
        if (!modelo.cad || !modelo.cad.usuarios) {
          console.warn('DB collection not ready, using in-memory fallback for registration');
          if (modelo.usuarios[obj.email]) {
            callback({ email: -1 });
            return;
          }
          const hash = await bcrypt.hash(obj.password, 10);
          const userObj = { email: obj.email, nick: obj.nick, password: hash, nombre: obj.nombre, apellidos: obj.apellidos, confirmada: true, key: Date.now().toString() };
          modelo.usuarios[obj.email] = userObj;
          try { correo.enviarEmail(obj.email, userObj.key, 'Confirmar cuenta'); } catch (e) { }
          callback(userObj);
          return;
        }

        const found = await modelo.cad.usuarios.findOne({ email: obj.email });
        if (found) {
          callback({ email: -1 });
          return;
        }

        const hash = await bcrypt.hash(obj.password, 10);
        obj.password = hash;
        obj.key = Date.now().toString();
        obj.confirmada = true;

        const insertRes = await modelo.cad.usuarios.insertOne(obj);
        console.log('insertOne result:', insertRes && insertRes.insertedId);
        try { correo.enviarEmail(obj.email, obj.key, 'Confirmar cuenta'); } catch (e) { }
        callback(obj);
      } catch (err) {
        console.error('registrarUsuario error:', err);
        callback(undefined);
      }
    })();
  }

  this.confirmarUsuario = function (obj, callback) {
    let modelo = this;
    this.cad.buscarUsuario({ "email": obj.email, "confirmada": false, "key": obj.key }, function (usr) {
      if (usr) {
        usr.confirmada = true;
        modelo.cad.actualizarUsuario(usr, function (res) {
          callback({ "email": res.email });
        })
      }
      else {
        callback({ "email": -1 });
      }
    })
  }


  this.loginUsuario = function (obj, callback) {
    const modelo = this;
    console.log('loginUsuario called for', obj && obj.email);
    (async function () {
      try {
        let usr;
        if (modelo.cad && modelo.cad.usuarios) {
          try {
            usr = await modelo.cad.usuarios.findOne({ email: obj.email });
            console.log('loginUsuario: direct findOne returned', !!usr, usr && usr.email);
          } catch (err) {
            console.error('loginUsuario: error using findOne:', err);
            callback({ nick: -1 });
            return;
          }
        } else {
          modelo.cad.buscarUsuario({ email: obj.email }, function (found) {
            usr = found;
            if (!usr) {
              console.log('loginUsuario: user not found (fallback)', obj.email);
              callback({ nick: -1 });
              return;
            }
            if (!usr.confirmada) {
              console.log('loginUsuario: user not confirmed (fallback)', obj.email);
              callback({ nick: -2 });
              return;
            }
            bcrypt.compare(obj.password, usr.password, function (err, result) {
              if (err) { console.error('bcrypt.compare error:', err); callback({ nick: -1 }); return; }
              if (result) {
                console.log('loginUsuario: password match (fallback) for', obj.email);
                callback(usr);
                modelo.agregarUsuario(usr.email || usr.nick || usr.email);
              } else {
                console.log('loginUsuario: password mismatch (fallback) for', obj.email);
                callback({ nick: -1 });
              }
            });
          });
          return;
        }

        if (!usr) {
          console.log('loginUsuario: user not found for', obj.email);
          callback({ nick: -1 });
          return;
        }
        if (!usr.confirmada) {
          console.log('loginUsuario: user not confirmed', obj.email);
          callback({ nick: -2 });
          return;
        }

        bcrypt.compare(obj.password, usr.password, function (err, result) {
          if (err) {
            console.error('bcrypt.compare error:', err);
            callback({ nick: -1 });
            return;
          }
          console.log('bcrypt.compare result for', obj.email, result);
          if (result) {
            console.log('loginUsuario: password match for', obj.email);
            callback(usr);
            modelo.agregarUsuario(usr.email || usr.nick || usr.email);
          } else {
            console.log('loginUsuario: password mismatch for', obj.email);
            callback({ nick: -1 });
          }
        });

      } catch (ex) {
        console.error('loginUsuario: unexpected exception', ex);
        try { callback({ nick: -1 }); } catch (e) { }
      }
    })();
  }



  this.obtenerUsuarios = function () {
    return this.usuarios;
  };

  this.usuarioActivo = function (nick) {
    return nick in this.usuarios;
  };

  this.numeroUsuarios = function () {
    return Object.keys(this.usuarios).length;
  };

  this.eliminarUsuario = function (nick) {
    if (nick in this.usuarios) {
      delete this.usuarios[nick];
      return true;
    }
    return false;
  };

  this.usuarioGoogle = async function (usr, callback) {
    const modelo = this;
    if (!modelo.cad || !modelo.cad.usuarios) {
      // fallback
      const obj = { email: usr.email };
      if (typeof callback === 'function') callback(obj);
      return obj;
    }

    try {
      const criterio = { email: usr.email };
      const res = await modelo.cad.usuarios.findOneAndUpdate(
        criterio,
        { $set: criterio },
        { upsert: true, returnDocument: 'after', projection: { email: 1 } }
      );

      const obj = (res && res.value) ? res.value : { email: usr.email };
      console.log('usuarioGoogle: obtained/created user', obj.email);

      try { modelo.agregarUsuario(obj.email); } catch (e) { }

      if (typeof callback === 'function') callback(obj); // ← se llama solo aquí
      return obj;

    } catch (err) {
      console.error('usuarioGoogle: error using findOneAndUpdate:', err);
      const obj = { email: usr.email };
      if (typeof callback === 'function') callback(obj); // ← se llama solo aquí si hubo error
      return obj;
    }
  };

}

function Usuario(nick) {
  this.nick = nick;
}

module.exports.Sistema = Sistema;

function ClienteRest() {
  var cli = this;

  // registrarUsuario(email, password, nombre, apellidos, [callback])
  // callback(success, nickOrError)
  this.registrarUsuario = function (email, password, nombre, apellidos, callback) {
    var payload = { email: email, password: password, nombre: nombre, apellidos: apellidos };
    $.ajax({
      type: 'POST',
      url: '/registrarUsuario',
      data: JSON.stringify(payload),
      contentType: 'application/json',
      success: function (data) {
        if (data && typeof data.nick !== 'undefined' && data.nick != -1) {
          console.log('Registro OK para', data.nick);
          // for now set a client cookie (not secure) to show UI state
          $.cookie('nick', data.nick, { path: '/' });
          if (typeof cw !== 'undefined' && typeof cw.limpiar === 'function') cw.limpiar();
          if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Registro recibido. Bienvenido, ' + data.nick);
          if (typeof callback === 'function') callback(true, data.nick);
        } else {
          if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Error en el registro: email ya en uso.');
          if (typeof callback === 'function') callback(false, data);
        }
      },
      error: function (xhr, status, err) {
        console.error('Error en registrarUsuario:', status, err);
        if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Error en el registro.');
        if (typeof callback === 'function') callback(false, { status: xhr.status, text: xhr.responseText });
      }
    });
  };
  
  this.cerrarSesion = function () {
    $.getJSON("/cerrarSesion", function () {
      console.log("Sesión cerrada");
      $.removeCookie("nick");
    });
  }

  this.loginUsuario = function (email, password) {
    $.ajax({
      type: 'POST',
      url: '/loginUsuario',
      data: JSON.stringify({ email: email, password: password }),
      contentType: 'application/json',
      success: function (data) {
        if (data && typeof data.nick !== 'undefined') {
          if (data.nick === -1) {
            if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Usuario o contraseña incorrectos');
          } else if (data.nick === -2) {
            if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Cuenta no confirmada. Revisa tu correo.');
          } else {
            $.cookie('nick', data.nick, { path: '/' });
            if (typeof cw !== 'undefined' && typeof cw.limpiar === 'function') cw.limpiar();
            if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Bienvenido, ' + data.nick);
            // redirect to main page so user sees the welcome state
            window.location = '/';
          }
        } else {
          if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Respuesta inesperada del servidor');
        }
      },
      error: function (xhr, status, err) {
        console.error('loginUsuario error:', status, err);
        if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Error al iniciar sesión');
      }
    });
  };

  this.agregarUsuario = function (nick) {
    var cli = this;
    $.getJSON('/agregarUsuario/' + nick, function (data) {
      var msg = 'El nick ' + nick + ' está ocupado';
      if (data && data.nick && data.nick != -1) {
        msg = 'Bienvenido al sistema, ' + nick;
        $.cookie('nick', nick, { path: '/' });
      }
      if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje(msg);
    });
  };

  this.comprobarSesion = function () {
    var nick = $.cookie('nick');
    if (nick) {
      if (typeof cw !== 'undefined' && typeof cw.mostrarMensaje === 'function') cw.mostrarMensaje('Bienvenido al sistema, ' + nick);
    } else {
      if (typeof cw !== 'undefined' && typeof cw.mostrarFormularioNick === 'function') cw.mostrarFormularioNick();
    }
  };

  this.agregarUsuario2 = function (nick) {
    $.ajax({
      type: 'GET',
      url: '/agregarUsuario/' + nick,
      success: function (data) {
        if (data && data.nick != -1) {
          console.log('Usuario ' + nick + ' ha sido registrado (usando agregarUsuario2)');
        } else {
          console.log('El nick ya está ocupado (usando agregarUsuario2)');
        }
      },
      error: function (xhr, status, err) {
        console.log('Status: ' + status);
        console.log('Error: ' + err);
      },
      contentType: 'application/json'
    });
  };

  this.obtenerUsuarios = function () {
    $.getJSON('/obtenerUsuarios', function (data) {
      console.log('Lista de usuarios:', data);
    });
  };

  this.numeroUsuarios = function () {
    $.getJSON('/numeroUsuarios', function (data) {
      console.log('Número de usuarios:', data);
    });
  };

  this.usuarioActivo = function (nick) {
    $.getJSON('/usuarioActivo/' + nick, function (data) {
      console.log('Usuario activo:', data);
    });
  };

  this.eliminarUsuario = function (nick) {
    $.getJSON('/eliminarUsuario/' + nick, function (data) {
      console.log('Usuario eliminado:', data);
    });
  };

}

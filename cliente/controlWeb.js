function ControlWeb() {

    this.mostrarAgregarUsuario = function () {

        $('#bnv').remove();
        $('#mAU').remove();
        let cadena = '<div id="mAU">';
        cadena = cadena + '<div class="card"><div class="card-body">';
        cadena = cadena + '<div class="form-group">';
        cadena = cadena + '<label for="nick">Nick:</label>';
        cadena = cadena + '<p><input type="text" class="form-control" id="nick" placeholder="introduce un nick"></p>';
        cadena = cadena + '<button id="btnAU" type="submit" class="btn btn-primary">Submit</button>';
        cadena = cadena + '<div><a href="/auth/google"><img src="/cliente/img/web_dark_sq_SI@1x.png" style="height:40px;"></a></div>';
        cadena = cadena + '</div>';
        cadena = cadena + '</div></div></div>';
        $("#au").append(cadena);

        $("#btnAU").on("click", function () {
            let nick = $("#nick").val().trim();

            if (nick === "") {
                alert("Por favor, introduce un nick.");
                return;
            }

            rest.agregarUsuario(nick);

            $("#mAU").remove();
        });
    };
    this.salir = function () {
        //localStorage.removeItem("nick");
        $.removeCookie("nick");
        location.reload();
        rest.cerrarSesion();
    }

    this.mostrarRegistro = function () {
        // Open dedicated registration page instead of loading inline to avoid overlap
        window.location = '/cliente/registro.html';
    }

    this.mostrarLogin = function () {
        // load dedicated login page into the main area to avoid overlap with registration
        window.location = '/cliente/login.html';
    };

    this.mostrarMensaje = function (msg) {
        // show a small message in the navbar
        $('#nav-welcome').html('<span style="background:#dff0d8;padding:8px;border-radius:6px;color:#31708f;">' + msg + '</span>');
        // and also display a dismissible alert in the main area
        $('#mAU').remove();
        $('#au').prepend('<div id="mAU"><div class="alert alert-info alert-dismissible" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            msg + '</div></div>');
    };

    this.mostrarFormularioNick = function () {
        // alias para compatibilidad con cliente anterior
        this.mostrarAgregarUsuario();
    };

    this.limpiar = function () {
        $('#mAU').remove();
        $('#registro').empty();
    };

}


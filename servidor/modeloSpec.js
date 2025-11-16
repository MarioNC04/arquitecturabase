const modelo = require("./modelo.js");

describe('El sistema', function() {
  let sistema;
  const Sistema = modelo.Sistema;

  beforeEach(function() {
    sistema = new Sistema();
  });

  it('inicialmente no hay usuarios', function() {
    expect(sistema.numeroUsuarios()).toEqual(0);
  });

  it('agregar usuario', function() {
    sistema.agregarUsuario("Samuel");
    expect(sistema.numeroUsuarios()).toEqual(1);
    expect(sistema.usuarioActivo("Samuel")).toBe(true);
  });

  it('obtener usuarios', function() {
    sistema.agregarUsuario("Samuel");
    sistema.agregarUsuario("maria jose");
    const usuarios = sistema.obtenerUsuarios();
    expect(Object.keys(usuarios).length).toEqual(2);
    expect(usuarios["Samuel"].nick).toEqual("Samuel");
    expect(usuarios["maria jose"].nick).toEqual("maria jose");
  });

  it('usuario activo', function() {
    sistema.agregarUsuario("Samuel");
    expect(sistema.usuarioActivo("Samuel")).toBe(true);
    expect(sistema.usuarioActivo("maria jose")).toBe(false);
  });

  it('eliminar usuario', function() {
    sistema.agregarUsuario("Samuel");
    expect(sistema.numeroUsuarios()).toEqual(1);

    sistema.eliminarUsuario("Samuel");
    expect(sistema.numeroUsuarios()).toEqual(0);
    expect(sistema.usuarioActivo("Samuel")).toBe(false);
  });
});
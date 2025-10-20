function Sistema(){
 this.usuarios={};
 this.agregarUsuario=function(nick){
 this.usuarios[nick]=new Usuario(nick);
 }
 this.obtenerUsuarios=function(){
 return this.usuarios;
 }
 this.usuarioActivo=function(nick){
 return nick in this.usuarios;
 }
 this.numeroUsuarios =function(){
 return Object.keys(this.usuarios).length;
 }
 this.eliminarUsuario=function(nick){
 return delete this.usuarios[nick];
 }
}
function Usuario(nick){
 this.nick=nick;
}

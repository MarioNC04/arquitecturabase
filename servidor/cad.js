const { MongoClient, ObjectId } = require('mongodb');

function CAD() {
    this.usuarios;

    this.buscarOCrearUsuario = function (usr, callback) {
        buscarOCrear(this.usuarios, usr, callback);
    }
    this.buscarUsuario = function (obj, callback) {
        buscar(this.usuarios, obj, callback);
    }
    this.insertarUsuario = function (usuario, callback) {
        insertar(this.usuarios, usuario, callback);
    }
    this.actualizarUsuario = function (obj, callback) {
        actualizar(this.usuarios, obj, callback);
    }

    function buscar(coleccion, criterio, callback) {
        try {
            if (!coleccion) {
                console.warn('CAD.buscar: colección undefined, criterio=', criterio);
                callback(undefined);
                return;
            }
            coleccion.find(criterio).toArray(function (error, usuarios) {
                if (error) {
                    console.error('CAD.buscar error:', error);
                    callback(undefined);
                    return;
                }
                if (!usuarios || usuarios.length == 0) {
                    callback(undefined);
                }
                else {
                    callback(usuarios[0]);
                }
            });
        } catch (ex) {
            console.error('CAD.buscar exception:', ex);
            try { callback(undefined); } catch (e) { }
        }
    }

    function insertar(coleccion, elemento, callback) {
        try {
            if (!coleccion) {
                console.warn('CAD.insertar: colección undefined');
                callback(undefined);
                return;
            }
            coleccion.insertOne(elemento, function (err, result) {
                if (err) {
                    console.error('CAD.insertar error:', err);
                    callback(undefined);
                }
                else {
                    console.log('Nuevo elemento creado, id=', result && result.insertedId);
                    callback(elemento);
                }
            });
        } catch (ex) {
            console.error('CAD.insertar exception:', ex);
            try { callback(undefined); } catch (e) { }
        }
    }


    function buscarOCrear(coleccion, criterio, callback) {
        try {
            if (!coleccion) {
                console.warn('CAD.buscarOCrear: colección undefined, criterio=', criterio);
                try { callback(undefined); } catch(e){}
                return;
            }
            console.log('CAD.buscarOCrear: criterio=', criterio);
            console.log('coleccion disponible?', !!coleccion, coleccion?.collectionName);

            coleccion.findOneAndUpdate(
                criterio,
                { $set: criterio },
                { upsert: true, returnDocument: 'after'},
                (err, doc) => {
                    if (err) {
                        console.error('CAD.buscarOCrear error:', err);
                        try { callback(undefined); } catch(e){}
                        return;
                    }
                    if (!doc || !doc.value) {
                        console.warn('CAD.buscarOCrear: no document returned for', criterio);
                        try { callback(undefined); } catch(e){}
                        return;
                    }
                    console.log('Elemento actualizado/creado:', doc.value.email);
                    try { callback({ email: doc.value.email }); } catch(e){}
                }
            );
        } catch (ex) {
            console.error('CAD.buscarOCrear exception:', ex);
            try { callback(undefined); } catch(e){}
        }
    }

    function actualizar(coleccion, obj, callback) {
        try {
            if (!coleccion) {
                console.warn('CAD.actualizar: colección undefined');
                callback(undefined);
                return;
            }
            coleccion.findOneAndUpdate({ _id: ObjectId(obj._id) }, { $set: obj }, { upsert: false, returnDocument: 'after', projection: { email: 1 } }, function (err, doc) {
                if (err) {
                    console.error('CAD.actualizar error:', err);
                    callback(undefined);
                    return;
                }
                if (!doc || !doc.value) {
                    console.warn('CAD.actualizar: no doc returned', obj._id);
                    callback(undefined);
                    return;
                }
                console.log('Elemento actualizado:', doc.value.email);
                callback({ email: doc.value.email });
            });
        } catch (ex) {
            console.error('CAD.actualizar exception:', ex);
            try { callback(undefined); } catch (e) { }
        }
    }


    this.conectar = async function (callback) {
        let cad = this;
        const uri = process.env.MONGO_URI || process.env.mongo_db || 'mongodb+srv://mncruz:mncruz04-@cluster0.wyf6yu4.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority';
        let client = new MongoClient(uri);
        await client.connect();
        const database = client.db(process.env.MONGO_DB || "procesos2425");
        console.log('CAD conectado a base de datos:', database.databaseName);
        cad.usuarios = database.collection("usuarios");
        callback(database);
    }

    this.confirmarUsuario = function (email, key, callback) {
        const filtro = { email: email, key: key };
        this.usuarios.findOneAndUpdate(filtro, { $set: { confirmada: true } }, { returnDocument: 'after' }, function (err, doc) {
            if (err) {
                console.error('Error al confirmar usuario', err);
                callback(undefined);
            } else {
                callback(doc && doc.value ? doc.value : undefined);
            }
        });
    }
}

module.exports.CAD = CAD;
module.exports.ObjectId = ObjectId;

exports.publicRoutesPaths = ["auth", "info-login"];

exports.messages = {
  /**users */
  USER_NO_REGISTRADO: "No se encontro usuario registrado con este correo",
  USER_NO_EXISTE: "Usuario no existe en la base de datos",
  USER_CREADO: "Usuario creado correctamente",
  USER_DUPLICADO: (email) =>
    `Ya hay un usuario registrado con este email ${email}`,
  WELCOME_SESSION: "Bienvenido a tu cuenta",
  CAMPO_REQUERIDO: (campo) => `${campo} es requerido`,
  CAMPO_INCORRECT: (campo) => `${campo} es incorrecto`,
  CAMPO_VACIO: (campo) => `${campo} no debe enviarse vacio`,
  /**passwords - mails */
  // bad req
  ERR_SAVE: (value) =>
    `${value} no ha sido creado por un problema en la consulta`,
  ERR_GET: (value) => `Error obteniendo ${value || "información"}`,
  ERR_EDIT: (model) => `Error al actalizar ${model}`,
  ERR_DELETE: (model) => `Error al borrar ${model || ""}`,
  SUCCESS: "Success",
  TOKEN_INVALID: "Token invalido o expirado",
  NO_PARAM: (param) => `Debe especificar un ${param}`,
  INCOMPLETE_DATA: "Datos incompletos",
  // Globals
  DATA_DUPLICATED: (value) =>
    `ya existe un registro de ${value} previamente creado`,
  DATA_ELIMINADO: (model) => `${model || ""} eliminado correctamente`,
  DATA_EDITADO: (model, fem = false) =>
    `${model || ""} ${fem ? "editada" : "editado"} correactamente`,
  DATA_NO_EXIST: (model) =>
    `${model || "data"} no registrado o no existe en nuestra base de datos`,
  CREATE_ERROR: (model) => `Error en creación ${model || ""}`,
  CREATE_SUCCESS: (model) => `${model || ""} creado correctamente`,
  NOT_SEND_VALUE: (value) => `Se debe proveer ${value}`,
  MAX_LENGTH: (value, max = undefined) =>
    `${value} excede la cantidad de caracteres permitidos ${max || ""}`,
  MIN_LENGTH: (value, min) =>
    `${value} debe tener un minimo de ${min || ""} caracteres`,
  VALUE_INVALID: (value) => `${value || ""} invalido`,
  NO_EXIST: (value) => `No existe ${value}`,
};

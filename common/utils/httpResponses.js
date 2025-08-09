/**
 * La función envía una respuesta de error HTTP con un mensaje de error y un código de estado especificados.
 * @param res - El objeto de respuesta que será enviado de vuelta al cliente.
 * @param error - El mensaje de error que se enviará en el cuerpo de la respuesta.
 * @param [codeError=400] - El código de estado HTTP que se enviará en la respuesta. El valor por defecto es 400
 * (Solicitud incorrecta) si no se especifica.
 */
exports.httpError = (res, error, codeError = 400) => {
  console.log({ error, codeError });
  res.status(codeError);
  res.send({ errors: { message: error } });
};

/**
 * Se utiliza para proporcionar información adicional o contexto sobre la respuesta que se envía al cliente.
 *Si no se proporciona ningún mensaje, se utilizará una cadena vacía como valor por defecto.
 * @param data - El parámetro data es la información que se enviará en el cuerpo de la respuesta. Puede ser
 * ser un objeto, un array, o cualquier otro tipo de dato que necesite ser enviado de vuelta al cliente
 */
exports.httpSend = (res, data, message = undefined) => {
  const isArrai = data && Array.isArray(data);
  res.status(200);
  res.send({
    message,
    records: isArrai ? data : undefined,
    record: !isArrai ? data : undefined,
  });
};

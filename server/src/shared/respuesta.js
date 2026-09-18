export function ok(res, data, meta = undefined) {
  return res.status(200).json(meta ? { data, meta } : { data });
}

export function creado(res, data) {
  return res.status(201).json({ data });
}

export function sinContenido(res) {
  return res.status(204).send();
}

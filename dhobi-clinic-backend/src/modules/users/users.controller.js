const svc = require('./users.service');

async function listUsers(req, res, next) {
  try {
    const users = await svc.listUsers(req.query.role);
    res.json(users);
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const user = await svc.createUser(req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const user = await svc.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) { next(err); }
}

async function deactivateUser(req, res, next) {
  try {
    const result = await svc.deactivateUser(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { listUsers, createUser, updateUser, deactivateUser };

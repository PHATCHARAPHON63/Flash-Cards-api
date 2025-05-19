const { Router } = require('express');
const {
  allowedRole,
  notAllowedRole,
} = require('../../middlewares/allow_role.middleware');


const user_router = Router();

//* /api/v1/user/*

module.exports = user_router;

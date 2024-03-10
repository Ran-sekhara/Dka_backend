// models/test.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Test = sequelize.define('test', {
  id_test: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  acetoneqt: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
}, {
  timestamps: false
});

module.exports = { Test, sequelize };

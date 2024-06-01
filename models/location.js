const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Test = require('./test');

const Location = sequelize.define('location', {
    id_location: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
    id_test: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW // Default value is the current timestamp
  }
}, {
    timestamps: false
});

module.exports = Location;
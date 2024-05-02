const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Test = require('./test');
const moment = require('moment');
const Patient = require('./patient');

const Device = sequelize.define('device', {
  ref_device: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'In use' 
  },
  archived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  id_patient: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false
});

Device.hasMany(Test, { foreignKey: 'ref_device' });

module.exports = Device;

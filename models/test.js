// models/test.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');
const Location = require('./location');

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
  createdAt: {
    type: DataTypes.DATE, 
    allowNull: false,
    defaultValue: DataTypes.NOW,
    get() {
      const formattedcreatedAt = moment(this.getDataValue('createdAt')).format('YYYY-MM-DD HH:mm');
      return formattedcreatedAt;
    }
    }   ,
  id_patient: {
    type: DataTypes.INTEGER,
    allowNull: true
},
  ref_device: {
    type: DataTypes.INTEGER,
    allowNull: false
},
hide: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false 
}
}, {
  timestamps: false
});
Test.hasOne(Location, { foreignKey: 'id_test' });

module.exports = Test;

// models/test.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');

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
    allowNull: false,
    get() {
      // Format the date using moment.js
      const formattedDate = moment(this.getDataValue('date')).format('YYYY-MM-DD HH:mm');
      return formattedDate;
    }
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
}, {
  timestamps: false
});

module.exports = Test;

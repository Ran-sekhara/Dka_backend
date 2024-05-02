const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');


const DkaHistory = sequelize.define('dkahistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    acetoneqt: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
    order: {
        type: DataTypes.ENUM('First Time', 'Second Time', 'Third Time', 'Fourth Time', 'Fifth Time', 'Sixth Time', 'Seventh Time', 'Eighth Time', 'Ninth Time', 'Tenth Time', 'More than Ten Times'),
        allowNull: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          // Format the date using moment.js
          const formattedDate = moment(this.getDataValue('date')).format('YYYY-MM-DD HH:mm');
          return formattedDate;
        }
      },
      id_folder: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: false 
});

module.exports = DkaHistory;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./patient'); 

const Token = sequelize.define('Token', {
    tokenId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    token: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {});

Token.belongsTo(Patient, { foreignKey: 'id_patient' }); 

module.exports = Token;

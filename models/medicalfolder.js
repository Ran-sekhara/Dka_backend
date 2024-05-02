const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const DkaHistory = require('./dkahistory');
const moment = require('moment');



const MedicalFolder = sequelize.define('medicalfolder', {
    id_folder: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    diabetes_type: {
        type: DataTypes.ENUM('Type 1', 'Type 2'), // Define the options as ENUM
        allowNull: true
    },
    diabetes_history: {
        type: DataTypes.DATEONLY,
        allowNull: true,
       },
    height: {
        type: DataTypes.STRING,
        allowNull: true,
       
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: true,
        
    },
    archived:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    id_patient: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
}, {
    timestamps: false // Disable timestamps
});
MedicalFolder.hasMany(DkaHistory, { foreignKey: 'id_folder' });
DkaHistory.belongsTo(MedicalFolder, { foreignKey: 'id_folder' });
module.exports = MedicalFolder;

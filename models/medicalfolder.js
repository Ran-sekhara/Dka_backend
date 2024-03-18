const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalFolder = sequelize.define('medicalfolder', {
    id_folder: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    diabetes_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    diabetes_history: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dka_history: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
   
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    height: {
        type: DataTypes.STRING,
        allowNull: true
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_patient: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

}, {
    timestamps: false // Disable timestamps
});
module.exports = MedicalFolder;
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
        allowNull: false
    },
    diabetes_history: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dka_history: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    id_patient: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

}, {
    timestamps: false // Disable timestamps
});
module.exports = MedicalFolder;
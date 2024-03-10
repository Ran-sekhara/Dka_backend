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
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    age: {
        type: DataTypes.INTEGER,
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
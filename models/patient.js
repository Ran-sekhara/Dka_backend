const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MedicalFolder = require('./medicalfolder');

const Patient = sequelize.define('patient', {
    id_patient: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    height: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: false // Disable timestamps
});

Patient.hasOne(MedicalFolder, { foreignKey: 'id_patient'});
module.exports = Patient;